import React, { useState, useRef, useMemo } from "react";
import { Upload, X, ChevronDown, ChevronUp, CheckCircle, Download, FileText, ArrowRight, ArrowLeft, Loader2, ZoomIn } from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import PaymentUpload, { PaymentMethod } from "@/components/PaymentUpload";
import logo from "/logo.webp";
import logo2 from "/logo2.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StepFormData {
  fullName: string;
  department: "CS" | "IT" | "IS";
  whatsapp: string;
  ticketName: string;
  extraCompanionsCount: number;
  gownSize: string;
  sashColors: string[];
  sashSize: "standard" | "large";
  sashName: string;
  trophyType: "brass" | "crystal";
  trophyName: string;
  paymentMethod: "instapay" | "vodafone" | "orange";
  transactionNumber: string;
  senderInfo: string;
}

export const MinimalStepGraduationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState<StepFormData>({
    fullName: "",
    department: "CS",
    whatsapp: "",
    ticketName: "",
    extraCompanionsCount: 0,
    gownSize: "L",
    sashColors: ["نبيتي"],
    sashSize: "standard",
    sashName: "",
    trophyType: "brass",
    trophyName: "",
    paymentMethod: "instapay",
    transactionNumber: "",
    senderInfo: "",
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; title: string } | null>(null);

  const totalSteps = 4;
  const stepLabels = ["الوشاح", "نوع وتصميم الدرع", "بيانات الخريج", "الدفع والإيصال"];

  // Dynamic Price Calculation:
  // Base 1100 EGP + (220 EGP per extra companion) + (50 EGP for crystal trophy) + (30 EGP for large sash size)
  const totalPrice = useMemo(() => {
    const base = 1100;
    const extraCompanionsPrice = (Number(formData.extraCompanionsCount) || 0) * 220;
    const trophyPrice = formData.trophyType === "crystal" ? 50 : 0;
    const sashSizePrice = formData.sashSize === "large" ? 30 : 0;
    return base + extraCompanionsPrice + trophyPrice + sashSizePrice;
  }, [formData.extraCompanionsCount, formData.trophyType, formData.sashSize]);

  const departmentOptions: ("CS" | "IT" | "IS")[] = ["CS", "IT", "IS"];

  const companionOptions = [
    { value: 0, label: "0 مرافق إضافي", text: "بدون مرافقين إضافيين (الاكتفاء بـ 2 المرافقين المجانيين المتضمنين بالتذكرة)", extraBadge: null },
    { value: 1, label: "1 مرافق إضافي", text: "إضافة 1 مرافق مدفوع فوق الـ 2 المجانيين", extraBadge: "+220 ج" },
    { value: 2, label: "2 مرافقين إضافيين", text: "إضافة 2 مرافقين مدفوعين فوق الـ 2 المجانيين", extraBadge: "+440 ج" },
  ];

  // Validation per step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.sashColors &&
          formData.sashColors.length >= 1 &&
          formData.sashColors.length <= 3 &&
          formData.sashName.trim() !== ""
        );
      case 2:
        return (
          formData.trophyType !== undefined &&
          formData.trophyName.trim() !== ""
        );
      case 3:
        return (
          formData.fullName.trim().length >= 4 &&
          formData.department !== undefined &&
          formData.whatsapp.trim().length === 11 &&
          formData.extraCompanionsCount !== undefined
        );
      case 4:
        return (
          formData.transactionNumber.trim() !== "" &&
          paymentScreenshot !== null
        );
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep <= totalSteps && canProceed()) {
      if (currentStep === totalSteps) {
        await handleSubmit();
      } else {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!paymentScreenshot) return;
    setIsSubmitting(true);
    try {
      const generatedOrderNumber = `GRAD-${Date.now().toString(36).toUpperCase()}`;
      const fileExt = paymentScreenshot.name.split(".").pop();
      const fileName = `${generatedOrderNumber}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, paymentScreenshot);

      if (uploadError) {
        console.warn("Storage upload notice:", uploadError);
      }

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      const productDetails = [
        { type: "ticket_name", value: formData.fullName },
        { type: "department", value: formData.department },
        { type: "extra_companions_count", value: String(formData.extraCompanionsCount) },
        { type: "sash_color", value: (formData.sashColors || []).join(" - ") },
        { type: "sash_size", value: formData.sashSize === "large" ? "مقاس أكبر (+30ج)" : "مقاس عادي" },
        { type: "sash_name", value: formData.sashName },
        { type: "trophy_type", value: formData.trophyType === "crystal" ? "درع كريستال (+50ج)" : "درع نحاسي (مجاناً)" },
        { type: "trophy_name", value: formData.trophyName },
      ];

      await supabase.from("bookings").insert({
        order_number: generatedOrderNumber,
        selected_package: "graduation_2026",
        student_tickets: 1,
        companion_tickets: 2 + formData.extraCompanionsCount,
        companions_details: productDetails,
        customer_name: formData.fullName,
        customer_phone: formData.whatsapp,
        customer_national_id: `${formData.fullName} | القسم: ${formData.department} | الدرع: ${formData.trophyName}`,
        customer_year: "2026",
        payment_method: formData.paymentMethod,
        transaction_number: formData.transactionNumber,
        sender_phone: formData.senderInfo || null,
        sender_name: formData.senderInfo || null,
        payment_screenshot_url: urlData?.publicUrl || "",
        total_price: totalPrice,
        booking_type: "graduation",
        batch: 2026,
      });

      setOrderNumber(generatedOrderNumber);
      setCurrentStep(5);
      toast.success("تم تأكيد طلب الحجز بنجاح");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "حدث خطأ أثناء حفظ الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData({
      fullName: "",
      department: "CS",
      whatsapp: "",
      ticketName: "",
      extraCompanionsCount: 0,
      gownSize: "L",
      sashColors: ["نبيتي"],
      sashSize: "standard",
      sashName: "",
      trophyType: "brass",
      trophyName: "",
      paymentMethod: "instapay",
      transactionNumber: "",
      senderInfo: "",
    });
    setPaymentScreenshot(null);
    setOrderNumber(null);
  };

  if (currentStep === 5) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-right animate-fade-in" dir="rtl">
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm relative overflow-hidden">
          <div className="h-3.5 bg-primary absolute top-0 left-0 right-0" />
          
          <div className="text-center space-y-4 pt-2">
            <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground">
              حفل تخرج كلية الحاسبات والمعلومات - جامعة طنطا
            </h2>
            
            <p className="text-base text-muted-foreground">
              تم تسجيل إجابتك وتأكيد حجزك بنجاح
            </p>

            <div className="bg-muted/40 p-4 rounded-xl text-sm space-y-2.5 border border-border text-right my-4">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الحجز التأكيدي:</span>
                <span className="font-bold font-mono text-primary">{orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">اسم الخريج:</span>
                <span className="font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">القسم / التخصص:</span>
                <span className="font-bold text-primary font-mono">{formData.department}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">لون الوشاح المعتمد:</span>
                <span className="font-bold text-primary">نبيتي ({formData.sashSize === "large" ? "مقاس أكبر +30ج" : "مقاس عادي"})</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">الاسم المطلوب على الوشاح:</span>
                <span className="font-bold text-primary">{formData.sashName}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">الاسم المطلوب على الدرع:</span>
                <span className="font-bold text-primary">{formData.trophyName} ({formData.trophyType === "crystal" ? "درع كريستال" : "درع نحاسي"})</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الواتساب:</span>
                <span className="font-bold font-mono" dir="ltr">{formData.whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ الإجمالي المسدد:</span>
                <span className="font-bold text-primary">{totalPrice} جنيه</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                طباعة / حفظ الإيصال والتذكرة
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-all"
              >
                حجز تخرج آخر
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-right space-y-4 sm:space-y-6" dir="rtl">
      {/* 1. Header Logos (Top Left & Right) */}
      <div className="flex items-center justify-between px-1">
        <img src={logo} alt="Logo" className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs" />
        <img src={logo2} alt="Logo 2" className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs" />
      </div>

      {/* 2. Separate Banner Image Card (Increased height for full view) */}
      <div className="relative h-52 sm:h-72 w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 shadow-xs bg-muted">
        <img
          src="/faculty-header.jpg"
          alt="كلية الحاسبات والمعلومات"
          className="w-full h-full object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* 3. Main Form Container (Clean & Containerless on all screens) */}
      <div className="bg-transparent p-0 space-y-6">
        {/* Main Info Section */}
        <div className="space-y-4 pb-4 border-b border-border/50">
          <h1 className="text-xl sm:text-2xl font-black text-foreground leading-snug tracking-tight">
            حفل تخرج كلية الحاسبات والمعلومات - جامعة طنطا
          </h1>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-primary">1100</span>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground">EGP</span>
          </div>

          {/* Priority Honoring Banner Card (No icons or emojis) */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 sm:p-4 space-y-1 text-right">
            <div className="text-sm font-bold text-primary">
              ترتيب التكريم بأولوية الحجز!
            </div>
            <p className="text-xs text-primary/85 font-medium leading-relaxed">
              تنبيه هام: يتم ترتيب المناداة وتكريم الخريجين على المسرح بأسبقية وأولوية الحجز والتسجيل.
            </p>
          </div>

          {/* Event Details Description with Dots */}
          <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed pt-1">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">تاريخ الحفل:</strong> أحد أيام (22 - 23 - 24) سبتمبر</p>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">مكان الحفل:</strong> قاعة المؤتمرات - المجمع الطبي - بجوار كلية العلوم</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">باكدج الخريج:</strong> شنطة سينيور - درع نحاسي - روب + كاب - وشاح باسمك - شهادة تكريم - تذاكر 2 مرافق مجاني</p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">لون الوشاح:</strong> اللون النبيتي (باختيار الأغلبية)</p>
            </div>
          </div>
        </div>

        {/* Step Progress Bar (Sticky Top during scroll) */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-3.5 px-0 border-b border-border/50 transition-all">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
        </div>

          {/* Step 1: Sash Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in pt-2">
              {/* Confirmed Winning Sash Color */}
              <div className="space-y-2">
                <label className="gform-label">
                  لون الوشاح <span className="text-destructive">*</span>
                </label>
                <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-xs sm:text-sm font-bold text-foreground flex items-center justify-between">
                  <span>اللون النبيتي (باختيار الأغلبية)</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#7A0C2E]" />
                </div>
              </div>

                {/* Sash Preview Image (Raised view with clean minimal border) */}
                <div className="my-3 flex flex-col items-center justify-center p-1">
                  <div className="overflow-hidden rounded-2xl border border-border/60 shadow-xs max-w-[240px] sm:max-w-[280px] bg-muted">
                    <img
                      src="/sash-preview.png"
                      alt="معاينة نموذج الوشاح"
                      className="w-full h-auto max-h-[260px] sm:max-h-[300px] object-cover object-[center_15%] hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>
                  <span className="pt-2 text-center text-xs font-medium text-muted-foreground">
                    نموذج لمعاينة تصميم وقصة الوشاح وروب التخرج
                  </span>
                </div>

              <hr className="border-border/40" />

              {/* Question 2 & 3 Combined: Sash Specifications */}
              <div className="space-y-4">
                {/* Sash Size Selection */}
                <div className="space-y-2.5">
                  <label className="gform-label">
                    مقاس الوشاح <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.sashSize === "standard"
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                          : "border-border/70 bg-background hover:border-border text-foreground"
                      }`}
                      onClick={() => setFormData({ ...formData, sashSize: "standard" })}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          formData.sashSize === "standard" ? "border-primary bg-primary" : "border-gray-300"
                        }`}>
                          {formData.sashSize === "standard" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold block">مقاس عادي (افتراضي)</span>
                          <span className="text-[11px] text-muted-foreground block font-normal">المقاس النمطي المناسب لمعظم الخريجين</span>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.sashSize === "large"
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                          : "border-border/70 bg-background hover:border-border text-foreground"
                      }`}
                      onClick={() => setFormData({ ...formData, sashSize: "large" })}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          formData.sashSize === "large" ? "border-primary bg-primary" : "border-gray-300"
                        }`}>
                          {formData.sashSize === "large" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold block">مقاس أكبر</span>
                          <span className="text-[11px] text-muted-foreground block font-normal">فوق 110 كجم أو الطول فوق 185 سم</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-primary shrink-0 mr-2">+30 ج</span>
                    </label>
                  </div>
                </div>

                <hr className="border-border/40 my-1" />

                {/* Sash Name Input */}
                <div className="space-y-2">
                  <label className="gform-label">
                    الاسم المطلوب كتابته على الوشاح (ثلاثي) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sashName}
                    onChange={(e) => setFormData({ ...formData, sashName: e.target.value })}
                    placeholder="مثال: عمر أحمد مصطفى"
                    className="gform-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Trophy Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-4">
                {/* Trophy Type Selection */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="gform-label">
                      اختر نوع درع التخرج <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      اختر نوع الدرع المفضل لديك (انقر على الصورة لمعاينتها بحجم أكبر).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Brass Shield Card (2nd image) */}
                    <div
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between ${
                        formData.trophyType === "brass"
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                          : "border-border/70 bg-card hover:border-primary/50 hover:shadow-xs"
                      }`}
                      onClick={() => setFormData({ ...formData, trophyType: "brass" })}
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-[4/5] sm:h-64 w-full overflow-hidden rounded-xl bg-slate-900/5 dark:bg-slate-900/40 border border-border/50 p-2 flex items-center justify-center group/img">
                          <img
                            src="/brass-shield.png"
                            alt="درع نحاسي"
                            className="h-full w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-xs"
                          />
                          <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs z-10">
                            متضمن مجاناً
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImage({ src: "/brass-shield.png", title: "درع نحاسي داخل علبة قطيفة" });
                            }}
                            className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 text-white opacity-90 hover:opacity-100 hover:bg-black/80 transition-all shadow-xs z-10"
                            title="توسيع الصورة"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5 pt-0.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            formData.trophyType === "brass" ? "border-primary bg-primary" : "border-gray-300"
                          }`}>
                            {formData.trophyType === "brass" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs sm:text-sm font-bold block text-foreground">درع نحاسي</span>
                        </div>
                      </div>
                    </div>

                    {/* Crystal Shield Card (1st image) */}
                    <div
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer p-3 flex flex-col justify-between ${
                        formData.trophyType === "crystal"
                          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                          : "border-border/70 bg-card hover:border-primary/50 hover:shadow-xs"
                      }`}
                      onClick={() => setFormData({ ...formData, trophyType: "crystal" })}
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-[4/5] sm:h-64 w-full overflow-hidden rounded-xl bg-slate-900/5 dark:bg-slate-900/40 border border-border/50 p-2 flex items-center justify-center group/img">
                          <img
                            src="/crystal-shield.png"
                            alt="درع كريستال"
                            className="h-full w-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-xs"
                          />
                          <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary text-white shadow-xs z-10">
                            +50 ج
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImage({ src: "/crystal-shield.png", title: "درع كريستال" });
                            }}
                            className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 text-white opacity-90 hover:opacity-100 hover:bg-black/80 transition-all shadow-xs z-10"
                            title="توسيع الصورة"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2.5 pt-0.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            formData.trophyType === "crystal" ? "border-primary bg-primary" : "border-gray-300"
                          }`}>
                            {formData.trophyType === "crystal" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs sm:text-sm font-bold block text-foreground">درع كريستال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border/40 my-1" />

                {/* Trophy Name Input */}
                <div className="space-y-2">
                  <label className="gform-label">
                    الاسم الثنائي المطلوب كتابته على الدرع <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.trophyName}
                    onChange={(e) => setFormData({ ...formData, trophyName: e.target.value })}
                    placeholder="مثال: عمر مصطفى"
                    className="gform-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Student Personal Information */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-4">
                {/* Field 1: Full Name */}
                <div className="space-y-1.5">
                  <label className="gform-label">
                    الاسم رباعي باللغة العربية <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="أدخل اسمك الرباعي كاملاً باللغة العربية"
                    className="gform-input"
                  />
                </div>

                <hr className="border-border/40 my-1" />

                {/* Field 2: Department Choice */}
                <div className="space-y-2">
                  <label className="gform-label">
                    القسم / التخصص <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs">
                    {departmentOptions.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setFormData({ ...formData, department: dept })}
                        className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all border ${
                          formData.department === dept
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-background border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border/40 my-1" />

                {/* Field 3: Whatsapp Number */}
                <div className="space-y-1.5">
                  <label className="gform-label">
                    رقم الواتس <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setFormData({ ...formData, whatsapp: val });
                    }}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className={`gform-input text-left font-mono ${
                      formData.whatsapp.length > 0 && formData.whatsapp.length < 11 ? "border-destructive text-destructive" : ""
                    }`}
                  />
                  {formData.whatsapp.length > 0 && formData.whatsapp.length < 11 && (
                    <p className="text-xs text-destructive mt-1">يجب أن يكون رقم الواتس 11 رقم ({formData.whatsapp.length}/11)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment Upload */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <PaymentUpload
                selectedPackage="graduation_2026"
                companions={[]}
                selectedMethod={formData.paymentMethod}
                onMethodSelect={(method) => setFormData({ ...formData, paymentMethod: method || "instapay" })}
                paymentScreenshot={paymentScreenshot}
                onScreenshotChange={(file) => setPaymentScreenshot(file)}
                paymentDetails={{
                  transactionNumber: formData.transactionNumber,
                  senderPhone: formData.senderInfo,
                  senderName: formData.senderInfo,
                }}
                onPaymentDetailsChange={(details) =>
                  setFormData({
                    ...formData,
                    transactionNumber: details.transactionNumber,
                    senderInfo: details.senderPhone || details.senderName || "",
                  })
                }
                companionsCount={formData.extraCompanionsCount}
                totalOverride={totalPrice}
              />
            </div>
          )}

          {/* Navigation Controls inside Main Card */}
          <div className="flex items-center justify-between pt-6 border-t border-border/60">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-30 flex items-center gap-1.5 px-2 py-1"
            >
              <ArrowRight className="w-4 h-4" />
              الخطوة السابقة
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="px-6 sm:px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  {currentStep === totalSteps ? "تأكيد وإرسال الحجز" : "الخطوة التالية"}
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
        </div>

        {/* Image Preview Modal */}
        {modalImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-xs"
            onClick={() => setModalImage(null)}
          >
            <div
              className="relative max-w-xl w-full bg-card rounded-2xl overflow-hidden border border-border p-3 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 pt-1 border-b border-border/50 pb-2">
                <h3 className="text-sm font-bold text-foreground">{modalImage.title}</h3>
                <button
                  type="button"
                  onClick={() => setModalImage(null)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl bg-black/5 flex items-center justify-center max-h-[75vh]">
                <img
                  src={modalImage.src}
                  alt={modalImage.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalStepGraduationForm;
