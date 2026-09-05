/**
 * خدمة الربط مع Google Drive وسائط حفل التخرج 2026
 * 
 * تدعم:
 * 1. الرفع والتخزين المباشر على Google Drive عبر Google Apps Script.
 * 2. التخزين المحلي الاحتياطي (IndexedDB) للعمل الفوري أثناء التطوير والاختبار قبل وضع الرابط.
 * 3. حماية الخصوصية: كل استعلام ورفع مرتبط فقط برقم هاتف الطالب.
 */

export interface MediaFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: "stage" | "memories";
  createdTime: string;
  thumbnailUrl: string;
  previewUrl: string;
  downloadUrl: string;
  webViewUrl?: string;
  isLocal?: boolean;
}

export interface StudentMediaResponse {
  stagePhoto: MediaFile | null;
  memories: MediaFile[];
  driveFolderLink?: string | null;
}

const STORAGE_KEY_URL = "graduation_google_script_url";
const DB_NAME = "graduation_media_db";
const DB_VERSION = 1;
const STORE_NAME = "student_media";

// تهيئة IndexedDB للتخزين الاحتياطي المحلي
function openLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("phone", "phone", { unique: false });
        store.createIndex("category", "category", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * الحصول على رابط Google Apps Script النشط
 */
export function getGoogleScriptUrl(): string {
  const custom = localStorage.getItem(STORAGE_KEY_URL);
  if (custom && custom.trim()) return custom.trim();
  const envUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim();
  return "https://script.google.com/macros/s/AKfycbzxehW2aZIXzxarf08L2VRx8AhBHdUA0bgDlsUteEaOKl_8F518JhfxnzskCiIjFxgGzQ/exec";
}

/**
 * تحديث رابط Google Apps Script
 */
export function setGoogleScriptUrl(url: string) {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }
}

/**
 * هل الربط مع جوجل درايف مفعل عبر رابط نشط؟
 */
export function isDriveConfigured(): boolean {
  return Boolean(getGoogleScriptUrl());
}

/**
 * تحويل ملف File إلى Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * استعلام وسائط الطالب عبر رقم الهاتف واسم الطالب
 */
export async function getStudentMedia(phone: string, studentName?: string): Promise<StudentMediaResponse> {
  const scriptUrl = getGoogleScriptUrl();
  const cleanPhone = phone.trim();
  const cleanName = (studentName || "").trim();

  // في حال وجود رابط Google Apps Script
  if (scriptUrl) {
    try {
      // نرسل POST كـ text/plain لتفادي مشاكل CORS Preflight مع جوجل
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "getMedia", phone: cleanPhone, studentName: cleanName }),
      });
      const data = await res.json();
      if (data && data.success) {
        return {
          stagePhoto: data.stagePhoto || null,
          memories: Array.isArray(data.memories) ? data.memories : [],
          driveFolderLink: data.driveFolderLink || null,
        };
      }
    } catch (err) {
      console.warn("فشل الاستعلام من Google Apps Script، جاري المحاولة محلياً:", err);
    }
  }

  // التخزين المحلي كبديل فوري آمن
  try {
    const db = await openLocalDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("phone");
    const req = index.getAll(cleanPhone);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const items = (req.result || []) as Array<MediaFile & { phone: string }>;
        const stage = items.find((i) => i.category === "stage") || null;
        const memories = items.filter((i) => i.category === "memories");
        resolve({ stagePhoto: stage, memories });
      };
      req.onerror = () => resolve({ stagePhoto: null, memories: [] });
    });
  } catch {
    return { stagePhoto: null, memories: [] };
  }
}

/**
 * رفع ملف وسائط (صورة تكريم أو ذكريات)
 */
export async function uploadStudentMedia(params: {
  phone: string;
  studentName: string;
  category: "stage" | "memories";
  file: File;
}): Promise<MediaFile> {
  const { phone, studentName, category, file } = params;
  const scriptUrl = getGoogleScriptUrl();
  const cleanPhone = phone.trim();

  const base64Data = await fileToBase64(file);

  // 1. إذا كان رابط جوجل درايف مفعل:
  if (scriptUrl) {
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "upload",
          phone: cleanPhone,
          studentName,
          category,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          base64Data,
        }),
      });

      const data = await res.json();
      if (data && data.success && data.file) {
        return data.file as MediaFile;
      }
      throw new Error(data?.error || "حدث خطأ أثناء الرفع إلى جوجل درايف");
    } catch (err: any) {
      console.error("خطأ الرفع لجوجل درايف:", err);
      // إذا فشل الرفع لجوجل درايف بسبب الاتصال، سنحفظ محلياً وننبه المستخدم
      throw err;
    }
  }

  // 2. إذا لم يتم وضع الرابط بعد: حفظ محلي فوري (Local Preview Mode)
  const localUrl = URL.createObjectURL(file);
  const localFile: MediaFile & { phone: string; dataUrl: string } = {
    id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    name: file.name,
    mimeType: file.type || (file.name.endsWith(".mp4") ? "video/mp4" : "image/jpeg"),
    size: file.size,
    category,
    createdTime: new Date().toISOString(),
    thumbnailUrl: localUrl,
    previewUrl: localUrl,
    downloadUrl: localUrl,
    isLocal: true,
    phone: cleanPhone,
    dataUrl: `data:${file.type};base64,${base64Data}`,
  };

  const db = await openLocalDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  // إذا كانت صورة تكريم: نمسح الصورة السابقة
  if (category === "stage") {
    const index = store.index("phone");
    const req = index.getAll(cleanPhone);
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        const existing = (req.result || []) as Array<MediaFile & { id: string }>;
        existing.forEach((item) => {
          if (item.category === "stage") {
            store.delete(item.id);
          }
        });
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  await new Promise<void>((resolve, reject) => {
    const putReq = store.put(localFile);
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });

  return localFile;
}

/**
 * حذف ملف وسائط
 */
export async function deleteStudentMedia(phone: string, fileId: string): Promise<boolean> {
  const scriptUrl = getGoogleScriptUrl();
  const cleanPhone = phone.trim();

  if (scriptUrl && !fileId.startsWith("local_")) {
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "deleteFile",
          phone: cleanPhone,
          fileId,
        }),
      });
      const data = await res.json();
      return Boolean(data && data.success);
    } catch (err) {
      console.error("خطأ حذف الملف من جوجل درايف:", err);
      return false;
    }
  }

  // حذف من التخزين المحلي
  try {
    const db = await openLocalDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * حفظ ملف رابط Google Drive داخل مجلد الخريج في Google Drive
 */
export async function saveExternalDriveLink(params: {
  phone: string;
  studentName?: string;
  link: string;
}): Promise<void> {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) return;

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveExternalLink",
        phone: params.phone.trim(),
        studentName: (params.studentName || "").trim(),
        link: params.link.trim(),
      }),
    });
    await res.json();
  } catch (err) {
    console.warn("فشل حفظ ملف الرابط في Google Drive:", err);
  }
}

/**
 * حذف ملف رابط Google Drive من مجلد الخريج في Google Drive
 */
export async function removeExternalDriveLink(params: {
  phone: string;
  studentName?: string;
}): Promise<void> {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) return;

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "removeExternalLink",
        phone: params.phone.trim(),
        studentName: (params.studentName || "").trim(),
      }),
    });
    await res.json();
  } catch (err) {
    console.warn("فشل حذف ملف الرابط من Google Drive:", err);
  }
}
