/**
 * Google Apps Script - كود الباك اند لربط جوجل درايف بحفل التخرج 2026
 * 
 * التحديث الجديد:
 * 1. الفولدر يتم إنشاؤه بـ "اسم الخريج فقط" (بدون رقم الهاتف في الاسم).
 * 2. منع تكرار الفولدرات: فحص ذكي بالاسم وبرقم الهاتف، وإذا كان الفولدر موجوداً مسبقاً يتم استخدامه فوراً ولا يُنشأ فولدر جديد.
 * 3. عرض الصور المخزنة في الدرايف فور فتح الصفحة في أي وقت.
 */

// أسماء الفولدرين الرئيسيين في جوجل درايف
const FOLDER_STAGE_ROOT = "صور التكريم على المسرح - حفل 2026";
const FOLDER_MEMORIES_ROOT = "الفيديوهات والصور المجمعة - حفل 2026";

/**
 * الحصول على الفولدر الرئيسي المخصص للفئة أو إنشاؤه
 */
function getRootCategoryFolder(category) {
  const folderName = category === "stage" ? FOLDER_STAGE_ROOT : FOLDER_MEMORIES_ROOT;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * البحث عن فولدر الخريج بدقة لمنع التكرار (بالاسم، أو بالوصف، أو بالرقم)
 */
function findStudentFolder(parentFolder, phone, studentName) {
  const cleanPhone = String(phone || "").trim();
  const cleanName = String(studentName || "").trim();

  const folders = parentFolder.getFolders();
  while (folders.hasNext()) {
    const f = folders.next();
    const fname = f.getName().trim();
    const fdesc = (f.getDescription() || "").trim();

    // 1. مطابقة بالاسم المباشر
    if (cleanName && fname === cleanName) {
      return f;
    }

    // 2. مطابقة بالرقم المحفوظ في وصف الفولدر
    if (cleanPhone && fdesc === cleanPhone) {
      return f;
    }

    // 3. مطابقة إذا كان الفولدر القديم يحتوي على الاسم أو الرقم
    if (cleanName && fname.indexOf(cleanName) !== -1) {
      return f;
    }
    if (cleanPhone && fname.indexOf(cleanPhone) !== -1) {
      return f;
    }
  }

  return null;
}

/**
 * الحصول على فولدر الخريج داخل الفولدر الرئيسي
 * التسمية: "اسم الخريج فقط"
 */
function getOrCreateStudentFolder(parentFolder, phone, studentName) {
  const cleanPhone = String(phone || "").trim();
  const cleanName = String(studentName || "").trim();

  // فحص إذا كان الفولدر موجود مسبقاً لمنع التكرار
  const existingFolder = findStudentFolder(parentFolder, cleanPhone, cleanName);
  if (existingFolder) {
    // تعديل الاسم القديم ليصبح باسم الخريج فقط إن لزم الأمر
    if (cleanName && existingFolder.getName() !== cleanName) {
      existingFolder.setName(cleanName);
    }
    if (cleanPhone && !existingFolder.getDescription()) {
      existingFolder.setDescription(cleanPhone);
    }
    return existingFolder;
  }

  // إذا لم يكن موجوداً، ننشئ الفولدر باسم الخريج فقط
  const targetName = cleanName || cleanPhone || "خريج";
  const newFolder = parentFolder.createFolder(targetName);
  if (cleanPhone) {
    newFolder.setDescription(cleanPhone);
  }
  return newFolder;
}

/**
 * تحويل ملف جوجل درايف إلى كائن بيانات للواجهة
 */
function formatDriveFile(file, category) {
  const fileId = file.getId();
  return {
    id: fileId,
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    category: category,
    createdTime: file.getDateCreated().toISOString(),
    thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=w1000",
    previewUrl: "https://drive.google.com/file/d/" + fileId + "/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
    webViewUrl: file.getUrl()
  };
}

/**
 * معالجة طلبات GET (الاستعلام)
 */
function doGet(e) {
  try {
    const phone = e.parameter.phone;
    const studentName = e.parameter.studentName || "";
    const action = e.parameter.action || "getMedia";

    if (!phone && !studentName) {
      return createJsonResponse({ success: false, error: "رقم الموبايل أو الاسم مطلوب" }, 400);
    }

    if (action === "getMedia") {
      const media = getStudentMedia(phone, studentName);
      return createJsonResponse({ success: true, ...media });
    }

    return createJsonResponse({ success: false, error: "إجراء غير معروف" }, 400);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * معالجة طلبات POST (الرفع، الحذف، والاستعلام)
 */
function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    const action = data.action;
    const phone = data.phone;
    const studentName = data.studentName || "";

    if (!phone && !studentName) {
      return createJsonResponse({ success: false, error: "رقم الموبايل أو الاسم مطلوب" }, 400);
    }

    // 1. رفع الملف
    if (action === "upload") {
      const category = data.category === "stage" ? "stage" : "memories";
      const fileName = data.fileName || ("media_" + Date.now());
      const mimeType = data.mimeType || "image/jpeg";
      const base64Data = data.base64Data;

      if (!base64Data) {
        return createJsonResponse({ success: false, error: "بيانات الملف مفقودة" }, 400);
      }

      // الحصول على الفولدر الرئيسي
      const mainFolder = getRootCategoryFolder(category);
      // إيجاد أو إنشاء فولدر باسم الخريج فقط
      const studentFolder = getOrCreateStudentFolder(mainFolder, phone, studentName);

      // في حال كانت صورة تكريم: مسح أي صورة قديمة ليتبقى دائماً صورة واحدة فقط
      if (category === "stage") {
        const oldFiles = studentFolder.getFiles();
        while (oldFiles.hasNext()) {
          const oldFile = oldFiles.next();
          oldFile.setTrashed(true);
        }
      }

      // فك تشفير البيانات وحفظ الملف في فولدر الخريج
      const decodedBytes = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
      const newFile = studentFolder.createFile(blob);

      // ضبط الصلاحية للمعاينة
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return createJsonResponse({
        success: true,
        message: "تم حفظ الملف بنجاح",
        file: formatDriveFile(newFile, category)
      });
    }

    // 2. حذف ملف
    if (action === "deleteFile") {
      const fileId = data.fileId;
      if (!fileId) {
        return createJsonResponse({ success: false, error: "معرف الملف مطلوب" }, 400);
      }

      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);

      return createJsonResponse({ success: true, message: "تم حذف الملف بنجاح" });
    }

    // 3. حفظ رابط مجلد خارجي داخل درايف
    if (action === "saveExternalLink") {
      const link = String(data.link || "").trim();
      if (!link) {
        return createJsonResponse({ success: false, error: "رابط المجلد مطلوب" }, 400);
      }

      // الحصول على الفولدر الرئيسي للذكريات
      const mainFolder = getRootCategoryFolder("memories");
      const studentFolder = getOrCreateStudentFolder(mainFolder, phone, studentName);

      // تحديث وصف الفولدر ليشمل الرابط ورقم الموبايل
      const basePhone = phone ? String(phone).trim() : "";
      studentFolder.setDescription(basePhone ? (basePhone + " | رابط درايف: " + link) : ("رابط درايف: " + link));

      // مسح أي ملف رابط قديم لتفادي التكرار
      const oldFiles = studentFolder.getFiles();
      while (oldFiles.hasNext()) {
        const f = oldFiles.next();
        const fname = f.getName();
        if (fname.indexOf("رابط_مجلد") !== -1 || fname.endsWith(".url") || fname === "drive_link.txt") {
          f.setTrashed(true);
        }
      }

      // 1. إنشاء ملف نصي يحتوي على الرابط
      const txtContent = "====================================\n" +
        "رابط مجلد Google Drive للصور والفيديوهات المجمعة\n" +
        "الخريج: " + (studentName || "خريج") + "\n" +
        "رقم الموبايل: " + (phone || "-") + "\n" +
        "تاريخ الإضافة: " + (new Date().toLocaleString("ar-EG")) + "\n" +
        "====================================\n\n" +
        "الرابط المباشر للمجلد:\n" +
        link + "\n\n" +
        "====================================";
      
      const txtFile = studentFolder.createFile("رابط_مجلد_الذكريات.txt", txtContent, MimeType.PLAIN_TEXT);
      txtFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // 2. إنشاء ملف اختصار إنترنت (.url) لفتحه مباشرة
      const urlContent = "[InternetShortcut]\nURL=" + link + "\n";
      const urlFile = studentFolder.createFile("فتح_مجلد_الذكريات.url", urlContent, MimeType.PLAIN_TEXT);
      urlFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return createJsonResponse({
        success: true,
        message: "تم حفظ ملف الرابط بنجاح داخل مجلد Google Drive",
        folderUrl: studentFolder.getUrl(),
        link: link
      });
    }

    // 4. حذف رابط مجلد خارجي من درايف
    if (action === "removeExternalLink") {
      const mainFolder = getRootCategoryFolder("memories");
      const studentFolder = findStudentFolder(mainFolder, phone, studentName);
      if (studentFolder) {
        const oldFiles = studentFolder.getFiles();
        while (oldFiles.hasNext()) {
          const f = oldFiles.next();
          const fname = f.getName();
          if (fname.indexOf("رابط_مجلد") !== -1 || fname.endsWith(".url") || fname === "drive_link.txt") {
            f.setTrashed(true);
          }
        }
      }
      return createJsonResponse({ success: true, message: "تم حذف ملف الرابط بنجاح" });
    }

    // 5. استعلام عن وسائط الطالب
    if (action === "getMedia") {
      const media = getStudentMedia(phone, studentName);
      return createJsonResponse({ success: true, ...media });
    }

    return createJsonResponse({ success: false, error: "إجراء غير مدعوم" }, 400);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * جلب وسائط الطالب من كلا الفولدرين وعرض الموجود دائماً
 */
function getStudentMedia(phone, studentName) {
  let stagePhoto = null;
  const memories = [];
  let driveFolderLink = null;

  // 1. البحث في فولدر صور التكريم
  try {
    const stageRoot = getRootCategoryFolder("stage");
    const studentStageFolder = findStudentFolder(stageRoot, phone, studentName);
    if (studentStageFolder) {
      const files = studentStageFolder.getFiles();
      while (files.hasNext()) {
        const f = files.next();
        if (!f.isTrashed()) {
          stagePhoto = formatDriveFile(f, "stage");
          break; // صورة واحدة فقط للتكريم
        }
      }
    }
  } catch (err) {
    console.warn("خطأ في جلب صورة التكريم:", err);
  }

  // 2. البحث في فولدر الفيديوهات والصور المجمعة
  try {
    const memoriesRoot = getRootCategoryFolder("memories");
    const studentMemoriesFolder = findStudentFolder(memoriesRoot, phone, studentName);
    if (studentMemoriesFolder) {
      const files = studentMemoriesFolder.getFiles();
      while (files.hasNext()) {
        const f = files.next();
        if (!f.isTrashed()) {
          const fname = f.getName();
          if (fname.indexOf("رابط_مجلد") !== -1 || fname.endsWith(".url") || fname === "drive_link.txt") {
            // قراءة الرابط من ملف الاختصار إن وجد
            try {
              const content = f.getBlob().getDataAsString();
              if (fname.endsWith(".url")) {
                const match = content.match(/URL=(.+)/i);
                if (match && match[1]) driveFolderLink = match[1].trim();
              } else {
                const lines = content.split("\n");
                for (let li = 0; li < lines.length; li++) {
                  const line = lines[li].trim();
                  if (line.startsWith("http://") || line.startsWith("https://")) {
                    driveFolderLink = line;
                    break;
                  }
                }
              }
            } catch (readErr) {}
          } else {
            memories.push(formatDriveFile(f, "memories"));
          }
        }
      }
    }
  } catch (err) {
    console.warn("خطأ في جلب ذكريات الأصدقاء:", err);
  }

  return { stagePhoto, memories, driveFolderLink };
}

/**
 * دالة مساعدة لإنشاء رد JSON مع الترويسات الصحيحة
 */
function createJsonResponse(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
