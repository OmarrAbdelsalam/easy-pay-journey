import React, { useState, useEffect } from "react";
import { Search, Phone, CheckCircle2, Clock, XCircle, Copy, ArrowRight, User, Award, Users, CreditCard, Calendar, Sparkles, RefreshCw, Lock, Eye, EyeOff, ShieldCheck, KeyRound, FileText, Camera, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { StudentMediaSection } from "@/components/StudentMediaSection";

// أرقام الموبايل المحمية بكلمة مرور خاصة
const PROTECTED_PHONE_PASSWORDS: Record<string, string> = {
  "01123141758": "Wheb4",
};

const normalizePhone = (value: string) => {
  const englishDigits = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

  let digits = englishDigits.replace(/\D/g, "");

  if (digits.startsWith("0020")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("20") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("1") && digits.length === 10) digits = `0${digits}`;

  return digits;
};

interface CompanionDetail {
  type: string;
  value: string;
  [key: string]: any;
}

interface BookingResult {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_year: string;
  selected_package: string;
  student_tickets: number;
  companion_tickets: number;
  companions_details: CompanionDetail[] | null;
  payment_method: string;
  transaction_number: string;
  sender_name: string | null;
  sender_phone: string | null;
  total_price: number;
  created_at: string;
  status: string;
  booking_type: string;
}

interface WaitingResult {
  id: string;
  name: string;
  phone: string;
  selected_package: string;
  created_at: string;
}

export const MyBooking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPhone = searchParams.get("phone") || "";
  const urlTab = searchParams.get("tab");
  const urlFolder = searchParams.get("folder");

  const [phone, setPhone] = useState(urlPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [waitingEntry, setWaitingEntry] = useState<WaitingResult | null>(null);

  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState<"booking" | "media">(
    urlTab === "booking" ? "booking" : "media"
  );
  const [activeFolder, setActiveFolder] = useState<"stage" | "memories">(
    urlFolder === "memories" ? "memories" : "stage"
  );

  const normalizedPhone = normalizePhone(phone);
  const isPhoneValid = /^01[0125]\d{8}$/.test(normalizedPhone);

  const updateUrl = (updates: {
    phone?: string;
    tab?: "booking" | "media";
    folder?: "stage" | "memories";
  }) => {
    const currentParams = new URLSearchParams(window.location.search);

    if (updates.phone !== undefined) {
      if (updates.phone) {
        currentParams.set("phone", updates.phone);
      } else {
        currentParams.delete("phone");
      }
    }

    const effectivePhone = updates.phone !== undefined ? updates.phone : (currentParams.get("phone") || phone);
    if (!effectivePhone) {
      setSearchParams({}, { replace: true });
      return;
    }

    const effectiveTab = updates.tab !== undefined ? updates.tab : (currentParams.get("tab") || activeTab);
    currentParams.set("tab", effectiveTab);

    if (effectiveTab === "media") {
      const effectiveFolder = updates.folder !== undefined ? updates.folder : (currentParams.get("folder") || activeFolder);
      currentParams.set("folder", effectiveFolder);
    } else {
      currentParams.delete("folder");
    }

    setSearchParams(currentParams, { replace: true });
  };

  const executeSearch = async (
    targetPhone: string,
    targetTab: "booking" | "media" = activeTab,
    targetFolder: "stage" | "memories" = activeFolder
  ) => {
    setIsLoading(true);
    setHasSearched(true);
    setActiveTab(targetTab);
    setActiveFolder(targetFolder);
    setBookings([]);
    setWaitingEntry(null);

    updateUrl({
      phone: targetPhone,
      tab: targetTab,
      folder: targetTab === "media" ? targetFolder : undefined,
    });

    try {
      // 1. Search in bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .or(`customer_phone.eq.${targetPhone},sender_phone.eq.${targetPhone}`)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      if (bookingsData && bookingsData.length > 0) {
        const formatted = bookingsData.map((b) => ({
          ...b,
          companions_details: Array.isArray(b.companions_details)
            ? (b.companions_details as unknown as CompanionDetail[])
            : [],
        })) as BookingResult[];
        setBookings(formatted);
      } else {
        // 2. Fallback: Search in waiting_list
        const { data: waitingData, error: waitingError } = await supabase
          .from("waiting_list")
          .select("*")
          .eq("phone", targetPhone)
          .maybeSingle();

        if (!waitingError && waitingData) {
          setWaitingEntry(waitingData as WaitingResult);
        }
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      toast.error("حدث خطأ أثناء الاستعلام، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  // المزامنة التلقائية عند الدخول برابط أو عمل ريلود
  useEffect(() => {
    const p = searchParams.get("phone");
    if (!p) return;

    const normalized = normalizePhone(p);
    if (!/^01[0125]\d{8}$/.test(normalized)) return;

    setPhone(normalized);

    const initialTab: "booking" | "media" =
      searchParams.get("tab") === "booking" ? "booking" : "media";
    const initialFolder: "stage" | "memories" =
      searchParams.get("folder") === "memories" ? "memories" : "stage";

    // فحص إذا كان الرقم محمي بكلمة مرور
    const requiredPassword = PROTECTED_PHONE_PASSWORDS[normalized];
    if (requiredPassword && unlockedPhone !== normalized) {
      setPasswordInput("");
      setPasswordError("");
      setShowPasswordModal(true);
      return;
    }

    executeSearch(normalized, initialTab, initialFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPhoneValid) {
      toast.error("يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم");
      return;
    }

    // فحص إذا كان الرقم محمي بكلمة مرور خاصة
    const requiredPassword = PROTECTED_PHONE_PASSWORDS[normalizedPhone];
    if (requiredPassword && unlockedPhone !== normalizedPhone) {
      setPasswordInput("");
      setPasswordError("");
      setShowPasswordModal(true);
      return;
    }

    executeSearch(normalizedPhone, activeTab, activeFolder);
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const requiredPassword = PROTECTED_PHONE_PASSWORDS[normalizedPhone];

    if (!passwordInput.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور");
      return;
    }

    if (passwordInput.trim() !== requiredPassword) {
      setPasswordError("كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى");
      toast.error("كلمة المرور غير صحيحة");
      return;
    }

    // كلمة المرور صحيحة
    setUnlockedPhone(normalizedPhone);
    setShowPasswordModal(false);
    setPasswordError("");
    toast.success("تم تأكيد كلمة المرور بنجاح");

    const targetTab = searchParams.get("tab") === "booking" ? "booking" : "media";
    const targetFolder = searchParams.get("folder") === "memories" ? "memories" : "stage";
    executeSearch(normalizedPhone, targetTab, targetFolder);
  };

  const handleTabChange = (newTab: "booking" | "media") => {
    setActiveTab(newTab);
    updateUrl({ tab: newTab, folder: newTab === "media" ? activeFolder : undefined });
  };

  const handleFolderChange = (newFolder: "stage" | "memories") => {
    setActiveFolder(newFolder);
    updateUrl({ folder: newFolder, tab: "media" });
  };

  const copyOrderNumber = (orderNum: string) => {
    navigator.clipboard.writeText(orderNum);
    toast.success("تم نسخ رقم الطلب");
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "approved":
        return {
          title: "تمت الموافقة وتأكيد الحجز",
          badgeClass: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          desc: "تمت مراجعة إيصال السداد والموافقة على حجزك بنجاح. ننتظرك في حفل التخرج!",
        };
      case "rejected":
        return {
          title: "تم رفض الحجز",
          badgeClass: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          desc: "لم يتم قبول الحجز أو التحويل. يرجى التواصل مع اللجنة المنظمة للاستفسار.",
        };
      default:
        return {
          title: "الطلب قيد المراجعة",
          badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          desc: "تم استلام بياناتك وإيصال التحويل، وجاري مراجعته والتدقيق من قِبل اللجنة المنظمة.",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-2 sm:py-8 sm:px-6" dir="rtl">
      <div className="max-w-2xl mx-auto w-full px-1 sm:px-0">
        {/* Top Header */}
        <div className="text-center mb-4 sm:mb-8">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <img src="/logo.webp" alt="FCI Logo" className="h-12 sm:h-16 w-auto mx-auto mb-2 sm:mb-4 drop-shadow-sm" />
          </Link>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1 sm:mb-2">
            استعلم عن بيانات حجزك
          </h1>
          <p className="text-slate-500 text-xs sm:text-base max-w-md mx-auto">
            اكتب رقم الموبايل الذي سجلت به للاطلاع على تفاصيل الطلب وحالة الاعتماد.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-6 shadow-xs border border-slate-200/80 mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="search-phone" className="text-sm font-bold text-slate-700">
                رقم الموبايل المسجل <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (unlockedPhone && normalizePhone(e.target.value) !== unlockedPhone) {
                      setUnlockedPhone(null);
                    }
                  }}
                  placeholder="01xxxxxxxxx"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  className="h-13 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-left font-mono text-lg pr-4 pl-11 tracking-wider"
                />
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isPhoneValid || isLoading}
              className="w-full h-12 rounded-xl text-base font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري البحث...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>عرض بيانات الحجز</span>
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Results Section */}
        {hasSearched && !isLoading && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Case 1: Found Bookings */}
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const statusInfo = getStatusDisplay(booking.status);
                const details = Array.isArray(booking.companions_details) ? booking.companions_details : [];
                const department = details.find((d: any) => d.type === "department")?.value;
                const sashColor = details.find((d: any) => d.type === "sash_color")?.value;
                const sashSize = details.find((d: any) => d.type === "sash_size")?.value;
                const sashName = details.find((d: any) => d.type === "sash_name")?.value;
                const trophyType = details.find((d: any) => d.type === "trophy_type")?.value;
                const trophyName = details.find((d: any) => d.type === "trophy_name")?.value;
                const extraCompanions = Number(details.find((d: any) => d.type === "extra_companions_count")?.value) || 0;
                const driveLink = details.find((d: any) => d.type === "drive_link")?.value;

                return (
                  <div key={booking.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Status Banner */}
                    <div className={`p-3 sm:p-4 border-b flex items-start sm:items-center justify-between gap-2.5 ${statusInfo.badgeClass}`}>
                      <div className="flex items-center gap-2.5">
                        {statusInfo.icon}
                        <div>
                          <h2 className="font-bold text-sm sm:text-lg">{statusInfo.title}</h2>
                          <p className="text-[11px] sm:text-xs opacity-90 mt-0.5">{statusInfo.desc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                      {/* Order Number & Student Name */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">اسم الخريج:</span>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900">{booking.customer_name}</h3>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 inline-block" dir="ltr">
                            {booking.customer_phone}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 sm:p-3 border border-slate-200/60 flex items-center justify-between sm:justify-start gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">رقم الطلب:</span>
                            <span className="text-xs font-mono font-bold text-slate-700">{booking.order_number}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                            onClick={() => copyOrderNumber(booking.order_number)}
                            title="نسخ رقم الطلب"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* 2 Tabs: الصور والوسائط | بيانات الحجز */}
                      <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleTabChange("media")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            activeTab === "media"
                              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>الصور والوسائط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTabChange("booking")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            activeTab === "booking"
                              ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>بيانات الحجز</span>
                        </button>
                      </div>

                      {/* Tab 1: بيانات الحجز */}
                      {activeTab === "booking" && (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                          {/* Standalone Burgundy Sash Note */}
                          <div className="bg-[#7A0C2E] text-white rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between shadow-xs">
                            <span className="text-xs sm:text-sm font-medium text-white/90">لون الوشاح:</span>
                            <span className="text-xs sm:text-sm font-bold text-white">
                              اللون النبيتي (باختيار الأغلبية)
                            </span>
                          </div>

                          {/* Unified Minimalist Details List */}
                          <div className="bg-slate-50/60 rounded-2xl border border-slate-200/60 divide-y divide-slate-200/60 overflow-hidden">
                            {department && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">القسم</span>
                                <span className="font-bold text-slate-900 text-xs sm:text-sm bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                                  {department}
                                </span>
                              </div>
                            )}

                            {sashSize && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">مقاس الوشاح</span>
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">{sashSize}</span>
                              </div>
                            )}

                            {sashName && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">الاسم على الوشاح</span>
                                <span className="font-bold text-purple-700 text-xs sm:text-sm">{sashName}</span>
                              </div>
                            )}

                            {trophyType && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">نوع الدرع</span>
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">{trophyType}</span>
                              </div>
                            )}

                            {trophyName && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">الاسم على الدرع</span>
                                <span className="font-bold text-amber-700 text-xs sm:text-sm">{trophyName}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between px-4 py-3">
                              <span className="text-slate-500 font-medium text-xs sm:text-sm">التذاكر والحضور</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm text-left">
                                1 خريج + 2 مرافق مجاناً {extraCompanions > 0 ? `+ ${extraCompanions} مرافق إضافي` : ""}
                                <span className="text-slate-400 font-normal mr-1.5">({3 + extraCompanions} أفراد)</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between px-4 py-3">
                              <span className="text-slate-500 font-medium text-xs sm:text-sm">وسيلة الدفع والمعاملة</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm text-left font-mono">
                                {booking.payment_method.toUpperCase()} • {booking.transaction_number}
                              </span>
                            </div>

                            <div className="flex items-center justify-between px-4 py-3">
                              <span className="text-slate-500 font-medium text-xs sm:text-sm">تاريخ التسجيل</span>
                              <span className="text-slate-700 font-medium text-xs sm:text-sm">
                                {new Date(booking.created_at).toLocaleDateString("ar-EG", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            {driveLink && (
                              <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-slate-500 font-medium text-xs sm:text-sm">مجلد Google Drive للذكريات</span>
                                <a
                                  href={driveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>فتح المجلد</span>
                                </a>
                              </div>
                            )}

                            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-100/50">
                              <span className="text-slate-800 font-bold text-xs sm:text-sm">المبلغ الإجمالي المسدد</span>
                              <span className="font-black text-emerald-600 text-base sm:text-lg">
                                {Number(booking.total_price).toLocaleString()} ج.م
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: الصور والوسائط */}
                      {activeTab === "media" && (
                        <div className="animate-in fade-in-50 duration-200">
                          <StudentMediaSection
                            phone={booking.customer_phone}
                            studentName={booking.customer_name}
                            bookingId={booking.id}
                            initialDriveLink={driveLink || ""}
                            activeFolder={activeFolder}
                            onFolderChange={handleFolderChange}
                            onDriveLinkUpdated={(newLink) => {
                              setBookings((prev) =>
                                prev.map((b) => {
                                  if (b.id !== booking.id) return b;
                                  const currentDetails = Array.isArray(b.companions_details)
                                    ? [...b.companions_details]
                                    : [];
                                  const filtered = currentDetails.filter((d: any) => d.type !== "drive_link");
                                  if (newLink) {
                                    filtered.push({ type: "drive_link", value: newLink });
                                  }
                                  return { ...b, companions_details: filtered };
                                })
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : waitingEntry ? (
              /* Case 2: Found in Waiting List */
              <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  قائمة الانتظار
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  مرحباً {waitingEntry.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto mb-4">
                  أنت مسجل حالياً في **قائمة الانتظار** الخاصة بحفلة التخرج. سيتم التواصل معك عبر الواتساب أو الاتصال فور إتاحة مقاعد أو تذاكر إضافية.
                </p>
                <div className="text-xs text-slate-400">
                  تاريخ التسجيل: {new Date(waitingEntry.created_at).toLocaleDateString("ar-EG")}
                </div>
              </div>
            ) : (
              /* Case 3: Not Found */
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  لم يتم العثور على حجز مسجل بهذا الرقم
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  تأكد من كتابة نفس رقم الموبايل الذي أدخلته أثناء التسجيل في الاستمارة (11 رقم).
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPhone("");
                      setHasSearched(false);
                      setBookings([]);
                      setWaitingEntry(null);
                      setSearchParams({}, { replace: true });
                    }}
                    className="rounded-xl border-slate-300"
                  >
                    محاولة برقم آخر
                  </Button>
                  <Link to="/">
                    <Button className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
                      الذهاب لصفحة الحجز <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 font-medium"
          >
            <span>العودة للصفحة الرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Password Verification Modal for Protected Bookings */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">هذا الحجز محمي بكلمة مرور</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                يرجى إدخال كلمة المرور المخصصة لهذا الرقم للاطلاع على تفاصيل الحجز ورفع الوسائط.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4 pt-2">
              <div className="space-y-1.5 text-right">
                <Label htmlFor="protected-pwd" className="text-xs font-bold text-slate-700">
                  كلمة المرور المطلوبة
                </Label>
                <div className="relative">
                  <Input
                    id="protected-pwd"
                    type={showPasswordText ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="اكتب كلمة المرور هنا"
                    autoFocus
                    className="h-12 rounded-xl pr-4 pl-11 text-right font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  className="w-1/2 h-11 rounded-xl text-xs font-bold border-slate-300"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 h-11 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  تأكيد والدخول
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBooking;
