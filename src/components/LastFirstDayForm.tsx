import React, { useEffect, useRef, useState } from "react";
import { Upload, X, CheckCircle, Download, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import PaymentUpload from "@/components/PaymentUpload";
import logo from "/logo.webp";
import logo2 from "/logo2.webp";
import { publicSupabase as supabase } from "@/integrations/supabase/publicClient";
import { toast } from "sonner";
import { EVENT } from "@/config/event";

type Department = "CS" | "IT" | "IS";

interface FormData {
  fullName: string;
  department: Department;
  whatsapp: string;
  paymentMethod: "instapay" | "vodafone" | "orange";
  transactionNumber: string;
  senderPhone: string;
  senderName: string;
}

const emptyForm: FormData = {
  fullName: "",
  department: "CS",
  whatsapp: "",
  paymentMethod: "instapay",
  transactionNumber: "",
  senderPhone: "",
  senderName: "",
};

const MAX_PHOTO_MB = 10;
const departmentOptions: Department[] = ["CS", "IT", "IS"];

export const LastFirstDayForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 3;
  const stepLabels = ["بياناتك", "صورة الطفولة", "الدفع والإيصال"];
  const totalPrice = EVENT.price;

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length >= 4 && formData.whatsapp.trim().length === 11;
      case 2:
        return studentPhoto !== null;
      case 3:
        return (
          formData.transactionNumber.trim() !== "" &&
          (formData.paymentMethod === "instapay"
            ? formData.senderName.trim() !== ""
            : formData.senderPhone.length === 11) &&
          paymentScreenshot !== null
        );
      default:
        return true;
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("لازم تكون صورة");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`حجم الصورة أكبر من ${MAX_PHOTO_MB} MB`);
      return;
    }
    setStudentPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setStudentPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (currentStep === totalSteps) {
      await handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("payment-screenshots").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("payment-screenshots").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!paymentScreenshot || !studentPhoto) return;
    setIsSubmitting(true);
    try {
      const generatedOrderNumber = `${EVENT.orderPrefix}-${Date.now().toString(36).toUpperCase()}`;
      const ext = (f: File) => f.name.split(".").pop() || "jpg";

      // صورة الطالب وهو صغير هي اللي هتتطبع على الستيك، فلو فشل رفعها الحجز مايكملش
      const photoUrl = await uploadFile(
        studentPhoto,
        `student-photos/${generatedOrderNumber}.${ext(studentPhoto)}`
      );
      const screenshotUrl = await uploadFile(
        paymentScreenshot,
        `${generatedOrderNumber}-${Date.now()}.${ext(paymentScreenshot)}`
      );

      // InstaPay بيطلب اسم الحساب، والمحافظ بتطلب الرقم المحول منه
      const sender = (formData.paymentMethod === "instapay" ? formData.senderName : formData.senderPhone).trim();

      const details = [
        { type: "department", value: formData.department },
        { type: "student_photo", value: photoUrl },
      ];

      const { error: insertError } = await supabase.from("bookings").insert({
        order_number: generatedOrderNumber,
        selected_package: EVENT.selectedPackage,
        student_tickets: 1,
        companion_tickets: 0,
        companions_details: details,
        customer_name: formData.fullName.trim(),
        customer_phone: formData.whatsapp,
        customer_national_id: `${formData.fullName.trim()} | القسم: ${formData.department}`,
        customer_year: String(EVENT.batch),
        payment_method: formData.paymentMethod,
        transaction_number: formData.transactionNumber,
        sender_phone: sender || null,
        sender_name: sender || null,
        payment_screenshot_url: screenshotUrl,
        total_price: totalPrice,
        booking_type: "student",
        batch: EVENT.batch,
      });

      if (insertError) throw insertError;

      setOrderNumber(generatedOrderNumber);
      setCurrentStep(totalSteps + 1);
      toast.success("تم تأكيد طلب الحجز بنجاح");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submission error:", err);
      toast.error((err as { message?: string })?.message || "حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFormData(emptyForm);
    handleRemovePhoto();
    setPaymentScreenshot(null);
    setOrderNumber(null);
  };

  if (currentStep > totalSteps) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-right animate-fade-in" dir="rtl">
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm relative overflow-hidden">
          <div className="h-3.5 bg-primary absolute top-0 left-0 right-0" />

          <div className="text-center space-y-4 pt-2">
            <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-foreground" dir="ltr">{EVENT.title}</h2>
            <p className="text-base text-muted-foreground">تم تسجيل حجزك بنجاح، وجاري مراجعة التحويل</p>

            {photoPreview && (
              <img
                src={photoPreview}
                alt="صورتك"
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary/30"
              />
            )}

            <div className="bg-muted/40 p-4 rounded-xl text-sm space-y-2.5 border border-border text-right my-4">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الحجز:</span>
                <span className="font-bold font-mono text-primary">{orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">الاسم:</span>
                <span className="font-bold">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">القسم:</span>
                <span className="font-bold text-primary font-mono">{formData.department}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">رقم الواتساب:</span>
                <span className="font-bold font-mono" dir="ltr">{formData.whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ المسدد:</span>
                <span className="font-bold text-primary">{totalPrice} جنيه</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                طباعة / حفظ الإيصال
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-all"
              >
                حجز لطالب آخر
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-right space-y-4 sm:space-y-6" dir="rtl">
      <div className="flex items-center justify-between px-1">
        <img src={logo} alt="Logo" className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs" />
        <img src="/evora-logo.png" alt="Evora Events" className="h-10 sm:h-14 w-auto object-contain" />
        <img src={logo2} alt="Logo 2" className="h-9 sm:h-12 w-auto object-contain drop-shadow-xs" />
      </div>

      <div className="relative h-52 sm:h-72 w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 shadow-xs bg-muted">
        <img
          src="/faculty-header.jpg"
          alt="كلية الحاسبات والمعلومات"
          className="w-full h-full object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      <div className="bg-transparent p-0 space-y-6">
        <div className="space-y-4 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-snug tracking-tight" dir="ltr">
                {EVENT.title}
              </h1>
              <span
                className="text-primary text-xs sm:text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap"
                dir="ltr"
              >
                {EVENT.tagline}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{EVENT.subtitle}</p>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-primary">{EVENT.price}</span>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground">EGP</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed pt-1">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">الميعاد:</strong> {EVENT.dateLabel}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p><strong className="text-foreground font-bold">الحجز شامل:</strong> {EVENT.includes.join(" - ")}</p>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-3.5 px-0 border-b border-border/50 transition-all">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
        </div>

        {/* Step 1: Student info */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="gform-label">
                الاسم باللغة العربية <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="أدخل اسمك كاملاً"
                className="gform-input"
              />
            </div>

            <hr className="border-border/40 my-1" />

            <div className="space-y-2">
              <label className="gform-label">
                القسم <span className="text-destructive">*</span>
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
        )}

        {/* Step 2: Student photo (printed on the stick) */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              <label className="gform-label">
                صورتك وانت صغير <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ارفع صورة ليك وانت صغير (أيام المدرسة أو الطفولة). الصورة دي هي اللي هتتطبع على الستيك بتاعك وهتتنشر في البوست بتاعك على انستجرام. اختار صورة واحدة واضحة ووشك باين فيها كويس.
                الحد الأقصى {MAX_PHOTO_MB} MB.
              </p>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {!studentPhoto ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full border border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground font-medium">اضغط لرفع صورتك وانت صغير</p>
              </button>
            ) : (
              <div className="relative border border-primary rounded-xl overflow-hidden max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                  title="تغيير الصورة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {photoPreview && (
                  <img src={photoPreview} alt="صورتك" className="w-full max-h-80 object-contain bg-muted" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <PaymentUpload
              companions={[]}
              selectedMethod={formData.paymentMethod}
              onMethodSelect={(method) => setFormData({ ...formData, paymentMethod: method || "instapay" })}
              paymentScreenshot={paymentScreenshot}
              onScreenshotChange={(file) => setPaymentScreenshot(file)}
              paymentDetails={{
                transactionNumber: formData.transactionNumber,
                senderPhone: formData.senderPhone,
                senderName: formData.senderName,
              }}
              onPaymentDetailsChange={(details) =>
                setFormData({
                  ...formData,
                  transactionNumber: details.transactionNumber,
                  senderPhone: details.senderPhone,
                  senderName: details.senderName,
                })
              }
              companionsCount={0}
              totalOverride={totalPrice}
            />
          </div>
        )}

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
      </div>
    </div>
  );
};

export default LastFirstDayForm;
