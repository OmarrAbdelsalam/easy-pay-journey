import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  Camera,
  Clipboard,
  Folder,
  FolderOpen,
  Link2,
  ExternalLink,
  Edit3,
  Trash2,
  Info,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MediaFile,
  getStudentMedia,
  uploadStudentMedia,
  saveExternalDriveLink,
  removeExternalDriveLink,
  getGoogleScriptUrl,
  setGoogleScriptUrl,
  isDriveConfigured,
} from "@/services/driveStorage";
import {
  getCachedStudentMedia,
  setCachedStudentMedia,
  addUploadedMediaToCache,
  getCachedImageBlob,
  saveCachedImageBlob,
  createThumbnailDataUrl,
} from "@/services/mediaCache";

interface StudentMediaSectionProps {
  phone: string;
  studentName?: string;
  bookingId?: string;
  initialDriveLink?: string;
  onDriveLinkUpdated?: (newLink: string) => void;
  activeFolder?: "stage" | "memories";
  onFolderChange?: (folder: "stage" | "memories") => void;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

// Component for individual memory thumbnail with image loading spinner
interface MediaThumbnailItemProps {
  item: MediaFile;
  onPreview: (item: MediaFile) => void;
}

const MediaThumbnailItem: React.FC<MediaThumbnailItemProps> = ({ item, onPreview }) => {
  const isVideo = item.mimeType?.startsWith("video/") || item.name.endsWith(".mp4");
  const [isLoaded, setIsLoaded] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isVideo) return;
    let isMounted = true;
    if (item.id) {
      getCachedImageBlob(item.id).then((blob) => {
        if (isMounted && blob) {
          setCachedSrc(blob);
          setIsLoaded(true);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [item.id, isVideo]);

  // التحقق الفوري إذا كانت الصورة مخزنة في كاش المتصفح مسبقاً
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [cachedSrc]);

  return (
    <div
      onClick={() => onPreview(item)}
      className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-square flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm"
    >
      {isVideo ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
          <Film className="w-6 h-6 text-slate-300 mb-1" />
          <span className="text-[10px] text-slate-300 px-2 text-center line-clamp-1 font-mono" dir="ltr">
            {item.name}
          </span>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-white/20 text-[9px]">
            فيديو {formatFileSize(item.size)}
          </span>
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-100 overflow-hidden flex items-center justify-center">
          {!isLoaded && !cachedSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          )}
          <img
            ref={imgRef}
            src={cachedSrc || item.thumbnailUrl || item.previewUrl}
            alt={item.name}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              isLoaded || cachedSrc ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}

      {/* Eye preview icon on hover */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
        <Eye className="w-5 h-5 drop-shadow-sm" />
      </div>

      {/* File name footer */}
      <div
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-3 text-white text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity"
        dir="ltr"
      >
        {item.name}
      </div>
    </div>
  );
};

export const StudentMediaSection: React.FC<StudentMediaSectionProps> = ({
  phone,
  studentName,
  bookingId,
  initialDriveLink,
  onDriveLinkUpdated,
  activeFolder: propActiveFolder,
  onFolderChange,
}) => {
  // قراءة فورية من الكاش لمنع وميض التحميل والانتظار على الريلود
  const initialCache = React.useMemo(() => (phone ? getCachedStudentMedia(phone) : null), [phone]);

  const [stagePhoto, setStagePhoto] = useState<MediaFile | null>(initialCache?.stagePhoto || null);
  const [memories, setMemories] = useState<MediaFile[]>(initialCache?.memories || []);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [stageCachedSrc, setStageCachedSrc] = useState<string | null>(null);

  // Active folder: "stage" (صور التكريم على المسرح) | "memories" (ألبوم الذكريات مع الأصدقاء)
  const [internalFolder, setInternalFolder] = useState<"stage" | "memories">(
    propActiveFolder || "stage"
  );

  // Google Drive folder link state (stored in Supabase)
  const [driveFolderLink, setDriveFolderLink] = useState(initialDriveLink || "");
  const [inputLink, setInputLink] = useState(initialDriveLink || "");
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);

  // Uploading states
  const [isUploadingStage, setIsUploadingStage] = useState(false);
  const [isUploadingMemories, setIsUploadingMemories] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  // Drag & Drop visual states
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isDraggingMemories, setIsDraggingMemories] = useState(false);

  // Filter tab for memories: "all" | "images" | "videos"
  const [filterType, setFilterType] = useState<"all" | "images" | "videos">("all");

  // Lightbox Modal
  const [selectedPreview, setSelectedPreview] = useState<MediaFile | null>(null);

  // Loading states for images
  const [isStageImgLoading, setIsStageImgLoading] = useState(false);
  const [isPreviewImgLoading, setIsPreviewImgLoading] = useState(true);

  // Drive settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [driveUrl, setDriveUrl] = useState(getGoogleScriptUrl());
  const [isConfigured, setIsConfigured] = useState(isDriveConfigured());

  const stageInputRef = useRef<HTMLInputElement>(null);
  const memoriesInputRef = useRef<HTMLInputElement>(null);
  const stageImgRef = useRef<HTMLImageElement>(null);
  const prevStagePhotoIdRef = useRef<string | null>(stagePhoto?.id || null);

  const activeFolder = propActiveFolder || internalFolder;

  const handleSelectFolder = (folder: "stage" | "memories") => {
    setInternalFolder(folder);
    onFolderChange?.(folder);
  };

  // المزامنة الفورية عند تغير رقم الهاتف
  useEffect(() => {
    if (!phone) return;
    const cache = getCachedStudentMedia(phone);
    if (cache) {
      setStagePhoto(cache.stagePhoto);
      setMemories(cache.memories);
      setIsLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    if (propActiveFolder && propActiveFolder !== internalFolder) {
      setInternalFolder(propActiveFolder);
    }
  }, [propActiveFolder]);

  // جلب صورة التكريم من كاش IndexedDB فوراً
  useEffect(() => {
    if (!stagePhoto) {
      setStageCachedSrc(null);
      return;
    }
    let isMounted = true;
    if (stagePhoto.id) {
      getCachedImageBlob(stagePhoto.id).then((blob) => {
        if (isMounted && blob) {
          setStageCachedSrc(blob);
          setIsStageImgLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [stagePhoto?.id]);

  // تنبيه المستخدم عند محاولة إغلاق الصفحة أو الخروج أثناء الرفع
  useEffect(() => {
    const isUploading = isUploadingStage || isUploadingMemories;
    if (!isUploading) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "جاري رفع الصور حالياً، مغادرة الصفحة ستؤدي لإلغاء عملية الرفع!";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploadingStage, isUploadingMemories]);

  // إظهار مؤشر التحميل فقط إذا تغيرت صورة التكريم لصورة جديدة تماماً ولم تكن في الكاش
  useEffect(() => {
    if (stagePhoto && stagePhoto.id !== prevStagePhotoIdRef.current) {
      prevStagePhotoIdRef.current = stagePhoto.id;
      if (!stageCachedSrc) {
        setIsStageImgLoading(true);
      }
    }
  }, [stagePhoto?.id, stageCachedSrc]);

  // التحقق الفوري إذا كانت صورة المسرح جاهزة بالفعل في كاش المتصفح
  useEffect(() => {
    if (stageImgRef.current?.complete && stageImgRef.current.naturalWidth > 0) {
      setIsStageImgLoading(false);
    }
  }, [stageCachedSrc, stagePhoto?.thumbnailUrl]);

  useEffect(() => {
    if (selectedPreview) {
      setIsPreviewImgLoading(true);
    }
  }, [selectedPreview?.id, selectedPreview?.previewUrl, selectedPreview?.thumbnailUrl]);

  // Sync / Fetch saved drive folder link from Supabase
  useEffect(() => {
    if (initialDriveLink !== undefined) {
      setDriveFolderLink(initialDriveLink);
      setInputLink(initialDriveLink);
      return;
    }

    const fetchSavedDriveLink = async () => {
      if (!phone) return;
      try {
        let query = supabase.from("bookings").select("id, companions_details");
        if (bookingId) {
          query = query.eq("id", bookingId);
        } else {
          query = query.eq("customer_phone", phone).order("created_at", { ascending: false }).limit(1);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const details = Array.isArray(data[0].companions_details) ? data[0].companions_details : [];
          const found = details.find((d: any) => d.type === "drive_link")?.value || "";
          if (found) {
            setDriveFolderLink(found);
            setInputLink(found);
          }
        }
      } catch (err) {
        console.error("Error fetching drive link from Supabase:", err);
      }
    };

    fetchSavedDriveLink();
  }, [phone, bookingId, initialDriveLink]);

  // حفظ رابط مجلد Google Drive في Supabase
  const handleSaveDriveFolderLink = async () => {
    const trimmed = inputLink.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال رابط المجلد");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("يرجى إدخال رابط صحيح يبدأ بـ https://");
      return;
    }

    if (!trimmed.includes("drive.google.com")) {
      toast.warning("تأكد من أن الرابط هو رابط مجلد على Google Drive");
    }

    setIsSavingLink(true);
    try {
      let query = supabase.from("bookings").select("id, companions_details");
      if (bookingId) {
        query = query.eq("id", bookingId);
      } else {
        query = query.eq("customer_phone", phone).order("created_at", { ascending: false }).limit(1);
      }
      const { data: bookings, error: fetchErr } = await query;
      if (fetchErr || !bookings || bookings.length === 0) {
        throw new Error("لم يتم العثور على الحجز في قاعدة البيانات");
      }

      const targetBooking = bookings[0];
      const existingDetails = Array.isArray(targetBooking.companions_details)
        ? [...targetBooking.companions_details]
        : [];

      const updatedDetails = existingDetails.filter((d: any) => d.type !== "drive_link");
      updatedDetails.push({ type: "drive_link", value: trimmed });

      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ companions_details: updatedDetails })
        .eq("id", targetBooking.id);

      if (updateErr) throw updateErr;

      // حفظ ملف الرابط أيضاً داخل مجلد Google Drive الخاص بالطالب
      saveExternalDriveLink({ phone, studentName, link: trimmed });

      setDriveFolderLink(trimmed);
      setIsEditingLink(false);
      onDriveLinkUpdated?.(trimmed);
      toast.success("تم حفظ رابط المجلد بنجاح في حجزك وفي Google Drive");
    } catch (err: any) {
      console.error("فشل حفظ رابط مجلد Google Drive في Supabase:", err);
      toast.error(err.message || "حدث خطأ أثناء حفظ الرابط");
    } finally {
      setIsSavingLink(false);
    }
  };

  // حذف رابط مجلد Google Drive من Supabase وجوجل درايف
  const handleRemoveDriveFolderLink = async () => {
    setIsSavingLink(true);
    try {
      let query = supabase.from("bookings").select("id, companions_details");
      if (bookingId) {
        query = query.eq("id", bookingId);
      } else {
        query = query.eq("customer_phone", phone).order("created_at", { ascending: false }).limit(1);
      }
      const { data: bookings, error: fetchErr } = await query;
      if (fetchErr || !bookings || bookings.length === 0) {
        throw new Error("لم يتم العثور على الحجز");
      }

      const targetBooking = bookings[0];
      const existingDetails = Array.isArray(targetBooking.companions_details)
        ? [...targetBooking.companions_details]
        : [];

      const updatedDetails = existingDetails.filter((d: any) => d.type !== "drive_link");

      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ companions_details: updatedDetails })
        .eq("id", targetBooking.id);

      if (updateErr) throw updateErr;

      // حذف ملف الرابط أيضاً من مجلد Google Drive
      removeExternalDriveLink({ phone, studentName });

      setDriveFolderLink("");
      setInputLink("");
      setIsEditingLink(false);
      onDriveLinkUpdated?.("");
      toast.success("تم حذف الرابط بنجاح");
    } catch (err: any) {
      console.error("فشل حذف الرابط:", err);
      toast.error(err.message || "فشل حذف الرابط");
    } finally {
      setIsSavingLink(false);
    }
  };

  // جلب وسائط الطالب مع دعم الكاش الفوري
  const fetchMedia = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await getStudentMedia(phone, studentName);
      
      // نتحقق من التغييرات قبل التحديث لمنع أي وميض أو إعادة تحميل للصور
      setStagePhoto((prev) => {
        if (!prev && !res.stagePhoto) return prev;
        if (prev?.id === res.stagePhoto?.id && prev?.thumbnailUrl === res.stagePhoto?.thumbnailUrl) {
          return prev;
        }
        return res.stagePhoto;
      });

      setMemories((prev) => {
        if (
          prev.length === res.memories.length &&
          prev.every((m, idx) => m.id === res.memories[idx]?.id)
        ) {
          return prev;
        }
        return res.memories;
      });

      setCachedStudentMedia(phone, res);
      if (res.driveFolderLink && !driveFolderLink) {
        setDriveFolderLink(res.driveFolderLink);
        setInputLink(res.driveFolderLink);
      }
    } catch (err) {
      console.error("فشل جلب الوسائط:", err);
    } finally {
      setIsLoading(false);
    }
  }, [phone, studentName, driveFolderLink]);

  useEffect(() => {
    if (phone) {
      const hasCache = Boolean(getCachedStudentMedia(phone));
      fetchMedia(hasCache);
    }
  }, [phone, fetchMedia]);

  // معالجة رفع صورة التكريم
  const processStageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، الحد الأقصى 25 ميجابايت");
      return;
    }

    setIsUploadingStage(true);
    setUploadStatus("جاري رفع وحفظ صورة التكريم...");

    // إنشاء صورة مصغرة مضغوطة سريعة وخفيفة الحجم للكاش الفوري
    let thumbnailDataUrl = "";
    try {
      thumbnailDataUrl = await createThumbnailDataUrl(file, 360);
    } catch {
      // ignore
    }

    try {
      const uploaded = await uploadStudentMedia({
        phone,
        studentName,
        category: "stage",
        file,
      });

      setStagePhoto(uploaded);
      if (thumbnailDataUrl) {
        setStageCachedSrc(thumbnailDataUrl);
      }
      addUploadedMediaToCache(phone, "stage", uploaded, thumbnailDataUrl);
      toast.success("تم حفظ صورة التكريم بنجاح");
    } catch (err: any) {
      console.error(err);
      toast.error("حدث خطأ أثناء الرفع، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploadingStage(false);
      setUploadStatus("");
      if (stageInputRef.current) stageInputRef.current.value = "";
    }
  };

  const handleStageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processStageFile(files[0]);
    }
  };

  const handleStageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStage(true);
  };

  const handleStageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStage(false);
  };

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStage(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processStageFile(files[0]);
    }
  };

  // معالجة رفع ملفات الذكريات
  const processMemoriesFiles = useCallback(async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = fileList.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/") || f.name.endsWith(".mp4")
    );

    if (validFiles.length === 0) {
      toast.error("يرجى اختيار صور أو فيديوهات صالحة");
      return;
    }

    setIsUploadingMemories(true);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadPercent(Math.round(((i + 1) / validFiles.length) * 100));
      setUploadStatus(`جاري رفع (${i + 1} من ${validFiles.length}): ${file.name}`);

      let thumbnailDataUrl = "";
      try {
        if (file.type.startsWith("image/")) {
          thumbnailDataUrl = await createThumbnailDataUrl(file, 320);
        }
      } catch {
        // ignore
      }

      try {
        const uploaded = await uploadStudentMedia({
          phone,
          studentName,
          category: "memories",
          file,
        });
        setMemories((prev) => [uploaded, ...prev]);
        addUploadedMediaToCache(phone, "memories", uploaded, thumbnailDataUrl);
        successCount++;
      } catch (err) {
        console.error(`فشل رفع ${file.name}:`, err);
      }
    }

    setIsUploadingMemories(false);
    setUploadStatus("");
    setUploadPercent(0);
    if (memoriesInputRef.current) memoriesInputRef.current.value = "";

    if (successCount > 0) {
      toast.success(`تم رفع ${successCount} ملف بنجاح`);
    } else {
      toast.error("تعذر رفع الملفات، يرجى المحاولة مرة أخرى.");
    }
  }, [phone, studentName]);

  const handleMemoriesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processMemoriesFiles(Array.from(files));
    }
  };

  const handleMemoriesDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMemories(true);
  };

  const handleMemoriesDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMemories(false);
  };

  const handleMemoriesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMemories(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processMemoriesFiles(Array.from(files));
    }
  };

  // دعم لصق الصور مباشرة عبر Ctrl+V في الصفحة
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = item.type.split("/")[1] || "png";
            const file = new File(
              [blob],
              `pasted_image_${Date.now()}_${i + 1}.${ext}`,
              { type: item.type }
            );
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        toast.info(`تم رصد صورة من الحافظة (Paste)، جاري الرفع...`);
        processMemoriesFiles(files);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processMemoriesFiles]);

  // زر لصق صورة من الحافظة
  const handlePasteButtonClick = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.info("يمكنك الضغط على Ctrl+V من الكيبورد للصق الصورة مباشرة!");
        return;
      }
      const items = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const ext = type.split("/")[1] || "png";
            files.push(new File([blob], `pasted_${Date.now()}.${ext}`, { type }));
          }
        }
      }

      if (files.length > 0) {
        toast.info(`تم نسخ ${files.length} صورة من الحافظة، جاري الرفع...`);
        processMemoriesFiles(files);
      } else {
        toast.error("لم يتم العثور على صورة في الحافظة. انسخ صورة أولاً ثم اضغط هنا أو اضغط Ctrl+V");
      }
    } catch (err) {
      toast.info("اضغط على Ctrl+V من الكيبورد للصق الصورة المنسوخة");
    }
  };

  const filteredMemories = memories.filter((m) => {
    const isVideo = m.mimeType?.startsWith("video/") || m.name.endsWith(".mp4");
    if (filterType === "images") return !isVideo;
    if (filterType === "videos") return isVideo;
    return true;
  });

  const photoCount = memories.filter(
    (m) => !m.mimeType?.startsWith("video/") && !m.name.endsWith(".mp4")
  ).length;
  const videoCount = memories.length - photoCount;

  const handleNextPreview = () => {
    if (!selectedPreview) return;
    const currentIndex = filteredMemories.findIndex((m) => m.id === selectedPreview.id);
    if (currentIndex !== -1 && currentIndex < filteredMemories.length - 1) {
      setSelectedPreview(filteredMemories[currentIndex + 1]);
    } else if (filteredMemories.length > 0) {
      setSelectedPreview(filteredMemories[0]);
    }
  };

  const handlePrevPreview = () => {
    if (!selectedPreview) return;
    const currentIndex = filteredMemories.findIndex((m) => m.id === selectedPreview.id);
    if (currentIndex > 0) {
      setSelectedPreview(filteredMemories[currentIndex - 1]);
    } else if (filteredMemories.length > 0) {
      setSelectedPreview(filteredMemories[filteredMemories.length - 1]);
    }
  };

  const handleSaveDriveUrl = () => {
    setGoogleScriptUrl(driveUrl);
    setIsConfigured(isDriveConfigured());
    setShowSettings(false);
    toast.success("تم حفظ إعدادات Google Drive");
    fetchMedia();
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 text-right">
      {/* Subtle Connection Status bar */}
      <div className="flex items-center justify-between py-1 text-[11px] sm:text-xs text-slate-500 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>التخزين السحابي: متصل بـ Google Drive</span>
        </div>

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          title="إعدادات Google Drive"
          className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Initial loading state while fetching from Google Drive */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-xs font-medium text-slate-600">جاري فحص وجلب الصور من Google Drive...</span>
        </div>
      ) : (
        <>
          {/* فولدرين الوسائط: صورة التكريم | ألبوم الذكريات */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Folder 1: صور التكريم على المسرح */}
            <button
              type="button"
              onClick={() => handleSelectFolder("stage")}
              className={`p-3 sm:p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                activeFolder === "stage"
                  ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeFolder === "stage"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-amber-100/80 text-amber-700"
                  }`}
                >
                  {activeFolder === "stage" ? (
                    <FolderOpen className="w-5 h-5" />
                  ) : (
                    <Folder className="w-5 h-5" />
                  )}
                </div>

                {stagePhoto ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>تم الرفع</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                    فارغ
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  صور التكريم على المسرح
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                  صورة شخصية واحدة للشاشة
                </p>
              </div>
            </button>

            {/* Folder 2: ألبوم الذكريات مع الأصدقاء */}
            <button
              type="button"
              onClick={() => handleSelectFolder("memories")}
              className={`p-3 sm:p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                activeFolder === "memories"
                  ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-400/20 shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeFolder === "memories"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-100/80 text-blue-700"
                  }`}
                >
                  {activeFolder === "memories" ? (
                    <FolderOpen className="w-5 h-5" />
                  ) : (
                    <Folder className="w-5 h-5" />
                  )}
                </div>

                {driveFolderLink ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>رابط محفوظ</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                    فارغ
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  ألبوم الذكريات مع الأصدقاء
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                  رابط مجلد Google Drive
                </p>
              </div>
            </button>
          </div>

          {/* شريط مسار المجلد المفتوح */}
          <div className="flex items-center justify-between py-1.5 px-3 bg-slate-100/80 rounded-xl text-xs text-slate-600 border border-slate-200/60">
            <div className="flex items-center gap-1.5 font-medium">
              <FolderOpen className={`w-3.5 h-3.5 ${activeFolder === "stage" ? "text-amber-500" : "text-blue-600"}`} />
              <span className="text-slate-400">Google Drive /</span>
              <span className="font-bold text-slate-800">
                {activeFolder === "stage" ? "صور التكريم على المسرح" : "ألبوم الذكريات مع الأصدقاء"}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {activeFolder === "stage"
                ? (stagePhoto ? "ملف واحد جاهز" : "بانتظار إضافة الصورة")
                : (driveFolderLink ? "رابط درايف محفوظ" : "بانتظار إضافة الرابط")}
            </span>
          </div>

          {/* Folder 1: Stage Photo (صورة التكريم على المسرح) */}
          {activeFolder === "stage" && (
            <div className="space-y-2 sm:space-y-2.5 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-base font-bold text-slate-900">
                  صورة التكريم على المسرح
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  صورة شخصية واضحة، تُعرض على شاشة المسرح الرئيسية وقت تكريمك.
                </p>
              </div>

              {stagePhoto && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>تم الحفظ</span>
                </span>
              )}
            </div>

            <input
              ref={stageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleStageFileChange}
            />

            {stagePhoto ? (
              /* Preview of Uploaded Stage Photo (NO DELETE BUTTON) */
              <div
                onDragOver={handleStageDragOver}
                onDragLeave={handleStageDragLeave}
                onDrop={handleStageDrop}
                className={`relative overflow-hidden flex flex-row items-center gap-3 bg-slate-50 p-2.5 sm:p-4 rounded-xl border ${
                  isDraggingStage ? "border-slate-800 bg-slate-100" : "border-slate-200"
                }`}
              >
                {/* Loading overlay during upload/replacement */}
                {isUploadingStage && (
                  <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center gap-2 animate-in fade-in">
                    <RefreshCw className="w-5 h-5 text-slate-700 animate-spin" />
                    <span className="text-xs font-bold text-slate-800">{uploadStatus || "جاري حفظ وتحديث الصورة..."}</span>
                    <p className="text-[10.5px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      يرجى عدم إغلاق الصفحة أو الخروج حتى ينتهي الحفظ
                    </p>
                  </div>
                )}

                <div
                  onClick={() => setSelectedPreview(stagePhoto)}
                  className="relative group cursor-pointer w-20 h-28 sm:w-28 sm:h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center"
                >
                  {isStageImgLoading && !stageCachedSrc && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                      <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  )}
                  <img
                    ref={stageImgRef}
                    src={stageCachedSrc || stagePhoto.thumbnailUrl || stagePhoto.previewUrl}
                    alt="صورة التكريم"
                    onLoad={() => setIsStageImgLoading(false)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      !isStageImgLoading || stageCachedSrc ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="flex-1 text-right space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">الصورة الحالية:</span>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1" dir="ltr">
                    {stagePhoto.name}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block">
                    {formatFileSize(stagePhoto.size)} • اسحب صورة جديدة هنا لاستبدالها
                  </span>

                  <div className="flex items-center gap-2 pt-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploadingStage}
                      onClick={() => stageInputRef.current?.click()}
                      className="rounded-lg h-7 px-3 text-[11px] border-slate-300 font-medium"
                    >
                      <RefreshCw className="w-3 h-3 ml-1" />
                      تغيير الصورة
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
          /* Empty Stage Dropzone */
          <div
            onDragOver={handleStageDragOver}
            onDragLeave={handleStageDragLeave}
            onDrop={handleStageDrop}
            onClick={() => stageInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3.5 sm:p-6 text-center cursor-pointer transition-colors ${
              isDraggingStage
                ? "border-slate-900 bg-slate-100"
                : "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            {isUploadingStage ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">{uploadStatus}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <Camera className="w-5 h-5 text-slate-400" />
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  {isDraggingStage
                    ? "أفلت الصورة هنا لحفظها"
                    : "اسحب صورة التكريم هنا، أو اضغط للاختيار"}
                </p>
                <span className="text-[10px] text-slate-400">
                  صورة شخصية واحدة بدقة واضحة
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )}

        {/* Folder 2: Memories - رابط Google Drive فقط */}
        {activeFolder === "memories" && (
          <div className="space-y-2 sm:space-y-2.5 animate-in fade-in-50 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-base font-bold text-slate-900">
              ألبوم الذكريات مع الأصدقاء
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              شارك رابط مجلد Google Drive يحتوي على صور وفيديوهات الدفعة والأصحاب ليتم دمجها في فيديو ومونتاج حفل التخرج.
            </p>
          </div>
        </div>

        {/* كارت إضافة رابط مجلد Google Drive (حفظ في Supabase) */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3 text-right">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 flex-shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                  رابط مجلد Google Drive
                </h5>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  لمشاركة مجلد يحوي صوراً أو فيديوهات مجمّعة
                </p>
              </div>
            </div>

            {driveFolderLink && !isEditingLink && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                تم حفظ الرابط
              </span>
            )}
          </div>

          {/* عرض الرابط المحفوظ */}
          {driveFolderLink && !isEditingLink ? (
            <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a
                  href={driveFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 hover:text-blue-800 underline truncate flex-1"
                  dir="ltr"
                  title={driveFolderLink}
                >
                  {driveFolderLink}
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveDriveFolderLink}
                  disabled={isSavingLink}
                  className="rounded-xl h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-medium"
                >
                  <Trash2 className="w-3 h-3 ml-1" />
                  حذف الرابط
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputLink(driveFolderLink);
                    setIsEditingLink(true);
                  }}
                  disabled={isSavingLink}
                  className="rounded-xl h-8 px-3 text-xs border-slate-300 font-medium text-slate-700"
                >
                  <Edit3 className="w-3 h-3 ml-1" />
                  تعديل الرابط
                </Button>

                <a
                  href={driveFolderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl h-8 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>فتح في Google Drive</span>
                </a>
              </div>
            </div>
          ) : (
            /* حقل الإدخال */
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={inputLink}
                    onChange={(e) => setInputLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    dir="ltr"
                    className="w-full h-10 px-3 pl-8 text-xs font-mono rounded-xl border border-slate-300 focus:outline-slate-900 bg-white"
                  />
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2">
                  {isEditingLink && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingLink(false);
                        setInputLink(driveFolderLink);
                      }}
                      className="rounded-xl h-10 px-3 text-xs border-slate-300 font-medium"
                    >
                      إلغاء
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingLink || !inputLink.trim()}
                    onClick={handleSaveDriveFolderLink}
                    className="rounded-xl h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex-1 sm:flex-initial"
                  >
                    {isSavingLink ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>حفظ الرابط</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  تأكد أن إمكانية الوصول مضبوطة على:{" "}
                  <strong className="text-slate-700 font-semibold">أي شخص لديه الرابط (Anyone with the link)</strong>
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    )}
  </>
)}

      {/* Lightbox / Fullscreen Viewer */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-between border border-white/10 shadow-2xl">
            {/* Top bar */}
            <div className="w-full flex items-center justify-between p-3.5 bg-black/50 text-white text-xs border-b border-white/10">
              <span className="font-mono truncate max-w-md" dir="ltr">
                {selectedPreview.name} {selectedPreview.size > 0 ? `(${formatFileSize(selectedPreview.size)})` : ""}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content with Prev / Next */}
            <div className="relative w-full flex-1 p-4 flex items-center justify-center overflow-auto min-h-[50vh] max-h-[75vh]">
              {filteredMemories.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPreview}
                  className="absolute left-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {selectedPreview.mimeType?.startsWith("video/") || selectedPreview.name.endsWith(".mp4") ? (
                <video
                  src={selectedPreview.previewUrl || selectedPreview.downloadUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-xl"
                />
              ) : (
                <div className="relative flex items-center justify-center min-h-[250px] max-h-[70vh] max-w-full">
                  {isPreviewImgLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                      <RefreshCw className="w-6 h-6 animate-spin text-white" />
                      <span className="text-xs font-medium">جاري تحميل الصورة...</span>
                    </div>
                  )}
                  <img
                    src={selectedPreview.thumbnailUrl || selectedPreview.previewUrl}
                    alt={selectedPreview.name}
                    onLoad={() => setIsPreviewImgLoading(false)}
                    className={`max-h-[70vh] max-w-full object-contain rounded-xl transition-opacity duration-300 ${
                      isPreviewImgLoading ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              )}

              {filteredMemories.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextPreview}
                  className="absolute right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900">إعدادات Google Drive</h4>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                رابط Google Apps Script Web App:
              </label>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/xxxx/exec"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-xs focus:outline-slate-900"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="rounded-xl text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDriveUrl}
                className="rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
