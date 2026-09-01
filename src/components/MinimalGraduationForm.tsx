import React, { useState, useRef, useMemo } from "react";
import { Upload, X, ChevronDown, ChevronUp, CheckCircle, Download, FileText } from "lucide-react";
import instapayLogo from "@/assets/instapay-logo.png";
import vodafoneLogo from "@/assets/vodafone-logo.png";
import logo from "/logo.webp";
import logo2 from "/logo2.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MinimalFormData {
  fullName: string;
  whatsapp: string;
  ticketName: string;
  companionsCount: number | string;
  gownSize: string;
  paymentMethod: "instapay" | "vodafone";
  transactionNumber: string;
  senderInfo: string;
}

export const MinimalGraduationForm: React.FC = () => {
  const [formData, setFormData] = useState<MinimalFormData>({
    fullName: "",
    whatsapp: "",
    ticketName: "",
    companionsCount: 2,
    gownSize: "L",
    paymentMethod: "instapay",
    transactionNumber: "",
    senderInfo: "",
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Companion Options matching Google Form (Max 2 free companions)
  const companionOptions = [
    { value: 0, label: "0" },
    { value: 1, label: "1" },
    { value: 2, label: "2" },
  ];

  // Price Calculation
  const totalPrice = useMemo(() => {
    const base = 1100;
    if (typeof formData.companionsCount === "number" && formData.companionsCount > 2) {
      return base + (formData.companionsCount - 2) * 220;
    }
    return base;
  }, [formData.companionsCount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setPaymentScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isValid =
    formData.fullName.trim() !== "" &&
    formData.whatsapp.trim().length === 11 &&
    formData.ticketName.trim() !== "" &&
    formData.transactionNumber.trim() !== "" &&
    paymentScreenshot !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !paymentScreenshot) {
      toast.error("يرجى ملء جميع الحقول المطلوبة وإرفاق صورة التحويل");
      return;
    }

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
        { type: "ticket_name", value: formData.ticketName },
        { type: "companions_count", value: String(formData.companionsCount) },
        { type: "gown_size", value: formData.gownSize },
      ];

      await supabase.from("bookings").insert({
        order_number: generatedOrderNumber,
        selected_package: "graduation_2025",
        student_tickets: 1,
        companion_tickets: typeof formData.companionsCount === "number" ? formData.companionsCount : 2,
        companions_details: productDetails,
        customer_name: formData.fullName,
        customer_phone: formData.whatsapp,
        customer_national_id: `${formData.ticketName} | الروب: ${formData.gownSize}`,
        customer_year: "2025/2026",
        payment_method: formData.paymentMethod,
        transaction_number: formData.transactionNumber,
        sender_phone: formData.senderInfo || null,
        sender_name: formData.senderInfo || null,
        payment_screenshot_url: urlData?.publicUrl || "",
        total_price: totalPrice,
        booking_type: "graduation",
        batch: 2025,
      });

      setOrderNumber(generatedOrderNumber);
      setIsSubmitted(true);
      toast.success("تم إرسال النموذج وحفظ الحجز بنجاح!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(err.message || "حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm relative overflow-hidden">
          <div className="h-3 bg-primary absolute top-0 left-0 right-0" />
          
          <div className="text-center space-y-4 pt-2">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground">
              حفل تخرج كلية الحاسبات والمعلومات - جامعة طنطا
            </h2>
            
            <p className="text-base text-muted-foreground">
              تم تسجيل إجابتك وحفظ حجزك بنجاح! ♥️
            </p>

            <div className="bg-muted/40 p-4 rounded-xl text-sm space-y-2 border border-border text-right my-4">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الحجز التأكيدي:</span>
                <span className="font-bold font-mono text-primary">{orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">الاسم:</span>
                <span className="font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">اسم المناداة على التيكيت:</span>
                <span className="font-bold text-primary">{formData.ticketName}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الواتساب:</span>
                <span className="font-bold font-mono">{formData.whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ الإجمالي المسدد:</span>
                <span className="font-bold text-emerald-600">{totalPrice} جنيه</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                طباعة / حفظ الإيصال
              </button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    fullName: "",
                    whatsapp: "",
                    ticketName: "",
                    companionsCount: 2,
                    gownSize: "L",
                    paymentMethod: "instapay",
                    transactionNumber: "",
                    senderInfo: "",
                  });
                  setPaymentScreenshot(null);
                  setPreviewUrl(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-all"
              >
                إرسال إجابة أخرى
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-right" dir="rtl">
      {/* Logos Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
        <img src={logo2} alt="Logo 2" className="h-10 w-auto object-contain" />
      </div>

      {/* Main Header Form Card (Exact Google Forms Header Card Style) */}
      <div className="bg-card rounded-2xl border border-border shadow-sm relative overflow-hidden">
        {/* Burgundy Top Stripe Accent Bar */}
        <div className="h-3.5 bg-primary w-full" />
        
        <div className="p-6 sm:p-7 space-y-3">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
            حفل تخرج كلية الحاسبات والمعلومات - جامعة طنطا - دفعة 2025 ♥️
          </h1>
          
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 font-medium">
            <p><strong className="text-foreground">Event Timing:</strong> (22-23-24)/9/2025</p>
            <p><strong className="text-foreground">Event Address:</strong> قاعة المؤتمرات - المجمع الطبي - بجوار كلية العلوم</p>
          </div>

          <div className="pt-2 border-t border-border/70">
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              {showFullDetails ? "إخفاء التفاصيل الكاملة للعرض والباكدج" : "عرض التفاصيل الكاملة للعرض والباكدج (الدرع، الميديا، الديكور...)"}
              {showFullDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullDetails && (
              <div className="mt-3 p-4 bg-muted/40 rounded-xl text-xs sm:text-sm text-foreground/90 space-y-3 leading-relaxed border border-border">
                <p className="font-bold text-primary">العرض يشمل بالكامل:</p>
                
                <div>
                  <strong>1️⃣ الدرع + شهادة التخرج:</strong>
                  <p className="text-muted-foreground">درع نحاسي داخل علبة قطيفة 📦 (ومتاح كريستال أو أكريليك بتكلفة إضافية) - شهادة تكريم كوشيه 350 جرام 🎗</p>
                </div>

                <div>
                  <strong>2️⃣ الأرواب والكابات:</strong>
                  <p className="text-muted-foreground">روب + كاب - وشاح ستان مطبوع بديزاين وألوان مختلفة هنختارها سوا</p>
                </div>

                <div>
                  <strong>3️⃣ الميديا 📷:</strong>
                  <p className="text-muted-foreground">تيم تصوير احترافي (5 فوتوغرافرز + 2 فيديوجرافرز = 7 كاميرات بروفيشنال full-frame) - تغطية شاملة للفوتو آريا وداخل القاعة - برومو احترافي 🎥 - ريلز فردية وجماعية 📱 - Mobile Photography</p>
                </div>

                <div>
                  <strong>4️⃣ الديكوريشن ومواقع التصوير 🏵️:</strong>
                  <p className="text-muted-foreground">أكثر من 7 مناطق تصوير مختلفة (Entrance - نيون - Backdrops - فلاش بانل - مجسمات خشبية - بالونات - ورود) + ريد كاربت 👩‍🎓👨‍🎓</p>
                </div>

                <div>
                  <strong>5️⃣ تنظيم اليوم كاملًا:</strong>
                  <p className="text-muted-foreground">استقبال وتنظيم دخول المرافقين - ترتيب الجلوس - توزيع باكدج التخرج - تنظيم طابور العرض - إكانية تسليم الشنط قبل الحفل للحجز المبكر</p>
                </div>

                <div>
                  <strong>6️⃣ التصميمات والمطبوعات:</strong>
                  <p className="text-muted-foreground">هوية بصرية + لوجو الدفعة - 2 بانر كبير - 2 رول آب - دعوات VIP وتذاكر حضور</p>
                </div>

                <div>
                  <strong>7️⃣ مقدم الحفل 🎤:</strong>
                  <p className="text-muted-foreground">مذيع محترف متخصص بالحفلات والمؤتمرات - سكريبت مخصوص للدفعة + دروع تكريم لأساتذة الكلية 🎖️</p>
                </div>

                <div className="pt-2 border-t border-border font-medium text-xs">
                  <strong>📦 باكدج الخريج:</strong> شنطة سينيور 2025 🎓 - درع نحاسي - روب + كاب - وشاح باسمك وسنة التخرج - شهادة تكريم - تذاكر 2 مرافق مجاني - تاتو مؤقت حلال 🎨 - دوناتس Dippin 🍩 - هدية مميزة ✨
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-destructive font-semibold">
            <span>* يشير إلى حقل مطلوب</span>
          </div>
        </div>
      </div>

      {/* Form Questions */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 1: Name */}
        <div className="gform-section">
          <label className="gform-label">
            الاسم <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="نص الإجابة القصيرة"
            className="gform-input"
          />
        </div>

        {/* Field 2: Whatsapp */}
        <div className="gform-section">
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
            placeholder="نص الإجابة القصيرة"
            dir="ltr"
            className={`gform-input text-left font-mono ${
              formData.whatsapp.length > 0 && formData.whatsapp.length < 11 ? "border-destructive text-destructive" : ""
            }`}
          />
          {formData.whatsapp.length > 0 && formData.whatsapp.length < 11 && (
            <p className="text-xs text-destructive mt-1">يجب أن يكون رقم الواتس 11 رقم ({formData.whatsapp.length}/11)</p>
          )}
        </div>

        {/* Field 3: Ticket / Stage Name */}
        <div className="gform-section">
          <label className="gform-label">
            الاسم كما تريد أن يكتب على التيكيت و تتم المناداة به أثناء التكريم <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.ticketName}
            onChange={(e) => setFormData({ ...formData, ticketName: e.target.value })}
            placeholder="نص الإجابة القصيرة"
            className="gform-input"
          />
        </div>

        {/* Field 4: Companions Expected (Max 2 included) */}
        <div className="gform-section space-y-3">
          <label className="gform-label mb-1">
            عدد المرافقين المتوقع في التذكرة ( الحد الأقصى المجاني: 2 مرافقين ) <span className="text-destructive">*</span>
          </label>
          
          <div className="text-xs sm:text-sm text-foreground/80 space-y-1.5 bg-muted/30 p-3.5 rounded-xl border border-border leading-relaxed">
            <p className="font-bold text-primary">تنبيه هام:</p>
            <p>المبلغ الأساسي للتذكرة (1100 ج) يشمل حضور الخريج + حتى <strong>2 مرافقين مجاناً</strong> كحد أقصى.</p>
            <p className="text-muted-foreground text-xs">
              💡 بخلاف ذلك، أي مرافقين إضافيين فوق الـ 2 المجانيين (بسعر 220 ج للمرافق) سيتم طلبهم وتحديدهم لاحقاً عبر <strong>فورم الإضافات والمرافقين الإضافيين</strong> المخصص لذلك.
            </p>
          </div>

          {/* Radio Buttons Vertical List */}
          <div className="space-y-2 pt-2">
            {companionOptions.map((opt) => {
              const isSelected = formData.companionsCount === opt.value;
              return (
                <label
                  key={String(opt.value)}
                  className={`gform-radio-item ${isSelected ? "gform-radio-selected" : ""}`}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <input
                    type="radio"
                    name="companionsCount"
                    checked={isSelected}
                    onChange={() => setFormData({ ...formData, companionsCount: opt.value })}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Field 5: Gown Size Optional/Required */}
        <div className="gform-section">
          <label className="gform-label">
            مقاس روب التخرج <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {["S", "M", "L", "XL", "XXL", "XXXL"].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFormData({ ...formData, gownSize: sz })}
                className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                  formData.gownSize === sz
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-background border-border hover:border-primary/50 text-foreground"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Field 6: Payment Details & Screenshot Upload (Matching Screenshot 4) */}
        <div className="gform-section space-y-4">
          <label className="gform-label mb-1">
            المبلغ الكلي ورفع صورة تحويل فودافون كاش / انستاباي <span className="text-destructive">*</span>
          </label>

          <div className="bg-muted/30 p-4 rounded-xl text-xs sm:text-sm space-y-1.5 border border-border leading-relaxed">
            <p className="font-bold text-primary">المبلغ الكلي {totalPrice} جنيه شاملاً الآتي:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground pr-1">
              <li>الوشاح</li>
              <li>الكاب</li>
              <li>الروب</li>
              <li>الدرع النحاسي</li>
              <li>الشهادة</li>
              <li>عدد 2 مرافق</li>
              <li>تاتو مؤقت</li>
            </ol>
            <p className="pt-1 text-foreground">مع العلم: الإضافات والمرافقين سيتم فتح فورم خاصة بها</p>
            <p className="text-foreground">قم بإرفاق صوره واضح بها الرقم الذي تم التحويل اليه و المبلغ الذي تم تحويله</p>
            <p className="font-bold text-primary text-sm pt-1">رقم انستاباي فقط : 01015868707</p>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "instapay" })}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                formData.paymentMethod === "instapay"
                  ? "border-primary bg-primary/5 font-bold"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <img src={instapayLogo} alt="InstaPay" className="h-6 w-auto object-contain" />
              <span className="text-xs font-bold">InstaPay</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "vodafone" })}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                formData.paymentMethod === "vodafone"
                  ? "border-primary bg-primary/5 font-bold"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <img src={vodafoneLogo} alt="Vodafone" className="h-6 w-auto object-contain" />
              <span className="text-xs font-bold">فودافون كاش</span>
            </button>
          </div>

          {/* Transaction Number Input */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              رقم المعاملة (Transaction ID) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.transactionNumber}
              onChange={(e) => setFormData({ ...formData, transactionNumber: e.target.value })}
              placeholder="أدخل رقم عملية التحويل"
              className="gform-input text-left font-mono"
              dir="ltr"
            />
          </div>

          {/* Sender Phone/Name */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              الاسم أو الرقم المحول منه <span className="text-muted-foreground font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={formData.senderInfo}
              onChange={(e) => setFormData({ ...formData, senderInfo: e.target.value })}
              placeholder="اسم الحساب أو رقم المحفظة المحول منها"
              className="gform-input"
            />
          </div>

          {/* File Upload Box (Google Forms Upload Button Style) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-foreground mb-2">
              إيصال التحويل <span className="text-destructive">*</span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!paymentScreenshot ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-primary font-bold text-sm hover:bg-muted/50 transition-all bg-background shadow-sm"
              >
                <Upload className="w-4 h-4 text-primary" />
                إضافة ملف
              </button>
            ) : (
              <div className="relative border border-primary rounded-xl overflow-hidden p-2 bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                  {paymentScreenshot.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions / Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال"}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData({
                fullName: "",
                whatsapp: "",
                ticketName: "",
                companionsCount: 2,
                gownSize: "L",
                paymentMethod: "instapay",
                transactionNumber: "",
                senderInfo: "",
              });
              handleRemoveFile();
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            محو النماذج
          </button>
        </div>
      </form>

      <footer className="py-4 text-center text-[11px] text-muted-foreground">
        لا تقم أبدًا بإرسال كلمات المرور عبر نماذج Google أو هذا النموذج.
      </footer>
    </div>
  );
};

export default MinimalGraduationForm;
