/**
 * خدمة التخزين المؤقت (Cache) لوسائط وصور الطلاب
 * تتيح عرض الصور المرفوعة فوراً في 0 ثانية عند عمل ريلود للصفحة
 * بنظام Stale-While-Revalidate مع حماية كوتة التخزين المحلي
 */

import { MediaFile, StudentMediaResponse } from "./driveStorage";

const META_PREFIX = "graduation_media_cache_";
const DB_NAME = "graduation_media_blobs_db";
const DB_VERSION = 1;
const STORE_NAME = "image_blobs";

// ذاكرة سريعة في الرام لسرعة الوصول الفوري للصور
const memoryBlobMap = new Map<string, string>();

/**
 * فتح قاعدة بيانات IndexedDB لحفظ بيانات وصور Base64
 */
function openBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * تنظيف كائن الملف من أي DataURL كبير قبل الحفظ في localStorage
 * لمنع حدوث خطأ QuotaExceededError
 */
function sanitizeFileForStorage(file: MediaFile | null): MediaFile | null {
  if (!file) return null;
  const isDataUrl = (url?: string) => typeof url === "string" && url.startsWith("data:");
  return {
    ...file,
    thumbnailUrl: isDataUrl(file.thumbnailUrl) ? "" : file.thumbnailUrl,
    previewUrl: isDataUrl(file.previewUrl) ? "" : file.previewUrl,
  };
}

/**
 * جلب بيانات الوسائط المحفوظة في الكاش محلياً لرقم الطالب
 */
export function getCachedStudentMedia(phone: string): StudentMediaResponse | null {
  try {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;
    const raw = localStorage.getItem(META_PREFIX + cleanPhone);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        stagePhoto: parsed.stagePhoto || null,
        memories: Array.isArray(parsed.memories) ? parsed.memories : [],
        driveFolderLink: parsed.driveFolderLink || null,
      };
    }
  } catch (err) {
    console.warn("خطأ في قراءة كاش الوسائط:", err);
  }
  return null;
}

/**
 * حفظ قائمة وسائط الطالب في الكاش (localStorage) بأمان تام بدون DataUrls ضخمة
 */
export function setCachedStudentMedia(phone: string, data: StudentMediaResponse): void {
  try {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return;

    const sanitizedStage = sanitizeFileForStorage(data.stagePhoto);
    const sanitizedMemories = Array.isArray(data.memories)
      ? data.memories.map((m) => sanitizeFileForStorage(m) as MediaFile)
      : [];

    localStorage.setItem(
      META_PREFIX + cleanPhone,
      JSON.stringify({
        stagePhoto: sanitizedStage,
        memories: sanitizedMemories,
        driveFolderLink: data.driveFolderLink || null,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn("خطأ في حفظ كاش الوسائط:", err);
  }
}

/**
 * ضغط وإنشاء صورة مصغرة سريعة وخفيفة الحجم (~20-40KB) لتخزينها محلياً
 */
export async function createThumbnailDataUrl(file: File, maxSize = 360): Promise<string> {
  if (!file || !file.type.startsWith("image/")) return "";
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } else {
          resolve("");
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };
      img.src = url;
    } catch {
      resolve("");
    }
  });
}

/**
 * تحديث الكاش محلياً بعد رفع صورة جديدة فوراً
 */
export function addUploadedMediaToCache(
  phone: string,
  category: "stage" | "memories",
  file: MediaFile,
  thumbnailDataUrl?: string
): void {
  const current = getCachedStudentMedia(phone) || {
    stagePhoto: null,
    memories: [],
    driveFolderLink: null,
  };

  if (category === "stage") {
    current.stagePhoto = file;
  } else {
    // نضع الملف في المقدمة ونمنع التكرار
    current.memories = [file, ...current.memories.filter((m) => m.id !== file.id)];
  }

  setCachedStudentMedia(phone, current);

  // تخزين الصورة المصغرة في IndexedDB والذاكرة
  if (thumbnailDataUrl && file.id) {
    saveCachedImageBlob(file.id, thumbnailDataUrl);
  }
}

/**
 * حفظ DataURL لصورة في IndexedDB
 */
export async function saveCachedImageBlob(fileId: string, dataUrl: string): Promise<void> {
  if (!fileId || !dataUrl) return;
  memoryBlobMap.set(fileId, dataUrl);
  try {
    const db = await openBlobDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: fileId, dataUrl, savedAt: Date.now() });
  } catch (err) {
    console.warn("فشل حفظ صورة في IndexedDB:", err);
  }
}

/**
 * جلب DataURL لصورة محفوظة في IndexedDB
 */
export async function getCachedImageBlob(fileId: string): Promise<string | null> {
  if (!fileId) return null;
  if (memoryBlobMap.has(fileId)) {
    return memoryBlobMap.get(fileId) || null;
  }

  try {
    const db = await openBlobDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(fileId);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const item = req.result;
        if (item && item.dataUrl) {
          memoryBlobMap.set(fileId, item.dataUrl);
          resolve(item.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
