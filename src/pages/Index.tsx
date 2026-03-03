import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/cairo-trip-hero.webp";
import StepIndicator from "@/components/StepIndicator";
import CustomerInfo from "@/components/CustomerInfo";
import PaymentUpload, { PaymentMethod, PaymentDetails } from "@/components/PaymentUpload";
import OrderConfirmation from "@/components/OrderConfirmation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IndexProps {
  isGrad?: boolean;
}

const STORAGE_KEY = "cairo-trip-booking";
const STORAGE_KEY_GRAD = "cairo-trip-booking-grad";

const Index = ({ isGrad = false }: IndexProps) => {
  // تحميل البيانات المحفوظة مرة واحدة
  const storageKey = isGrad ? STORAGE_KEY_GRAD : STORAGE_KEY;
  
  const getSavedData = () => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  };

  const savedData = getSavedData();

  // لو الطلب مكتمل، نبدأ من step 5 (صفحة التأكيد)
  // غير كده نبدأ من step 1 دايماً
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (savedData?.isCompleted && savedData?.orderNumber) {
      return 5;
    }
    return 1;
  });
  
  const [selectedPackage, setSelectedPackage] = useState(() => {
    return savedData?.selectedPackage || "iftar";
  });
  
  const [companions, setCompanions] = useState(() => {
    return savedData?.companions || [];
  });
  
  const [customerInfo, setCustomerInfo] = useState(() => {
    return savedData?.customerInfo || {
      name: "",
      phone: "",
      year: "",
      companionsCount: 0
    };
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    return savedData?.paymentMethod || null;
  });
  
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() => {
    return savedData?.paymentDetails || {
      transactionNumber: "",
      senderPhone: "",
      senderName: ""
    };
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [orderNumber, setOrderNumber] = useState<string | null>(() => {
    return savedData?.orderNumber || null;
  });
  
  const [hasCompanionPending, setHasCompanionPending] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      currentStep,
      selectedPackage,
      companions,
      customerInfo,
      paymentMethod,
      paymentDetails,
      orderNumber,
      isCompleted: currentStep === 5 && orderNumber !== null
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [currentStep, selectedPackage, companions, customerInfo, paymentMethod, paymentDetails, orderNumber, storageKey]);
  const totalSteps = 2;
  const stepLabels = ["البيانات والتذاكر", "الدفع"];
  const showConfirmation = currentStep === 3;
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return customerInfo.name.trim() !== "" && customerInfo.phone.trim().length === 11 && customerInfo.year !== "";
      case 2:
        const hasRequiredDetails = paymentMethod === "instapay" ? paymentDetails.senderName.trim() !== "" : paymentDetails.senderPhone.trim().length === 11;
        return paymentMethod !== null && paymentScreenshot !== null && paymentDetails.transactionNumber.trim() !== "" && hasRequiredDetails;
      default:
        return true;
    }
  };
  const handleNext = async () => {
    if (currentStep <= totalSteps && canProceed()) {
      // If on payment step, submit to backend
      if (currentStep === totalSteps) {
        await submitBooking();
      } else {
        setCurrentStep((prev: number) => prev + 1);
      }
    }
  };

  const submitBooking = async () => {
    if (!paymentScreenshot || !selectedPackage) return;
    
    setIsSubmitting(true);
    try {
       // Generate order number
      const generatedOrderNumber = `IFT-${Date.now().toString(36).toUpperCase()}`;
      
      // Upload screenshot
      const fileExt = paymentScreenshot.name.split('.').pop();
      const fileName = `${generatedOrderNumber}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentScreenshot);
      
      if (uploadError) {
        throw new Error('فشل في رفع صورة التحويل');
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);
      
      // Calculate total price
      const mainTicketPrice = 270;
      const companionsTotal = customerInfo.companionsCount * 270;
      const totalPrice = mainTicketPrice + companionsTotal;
      
      // Prepare companions details
      const companionsDetails = new Array(customerInfo.companionsCount).fill(null).map((_, index) => ({
        index: index + 1,
        type: "standard",
        packageType: "iftar"
      }));
      
      // Insert booking
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          order_number: generatedOrderNumber,
          selected_package: "iftar",
          student_tickets: 1,
          companion_tickets: customerInfo.companionsCount,
          companions_details: companionsDetails.length > 0 ? companionsDetails : null,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_national_id: "-",
          customer_year: customerInfo.year,
          payment_method: paymentMethod || '',
          transaction_number: paymentDetails.transactionNumber,
          sender_phone: paymentDetails.senderPhone || null,
          sender_name: paymentDetails.senderName || null,
          payment_screenshot_url: urlData.publicUrl,
          total_price: totalPrice,
          booking_type: 'student',
          batch: 3 // إفطار رمضان 2026 - 11 مارس
        });
      
      if (insertError) {
        throw new Error('فشل في حفظ الحجز');
      }
      
      setOrderNumber(generatedOrderNumber);
      setCurrentStep((prev: number) => prev + 1);
      toast.success('تم تأكيد حجزك بنجاح!');
      
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CustomerInfo customerInfo={customerInfo} onCustomerInfoChange={setCustomerInfo} />;
      case 2:
        return <PaymentUpload 
          selectedPackage="iftar" 
          companions={[]} 
          companionsCount={customerInfo.companionsCount}
          selectedMethod={paymentMethod} 
          onMethodSelect={setPaymentMethod} 
          paymentScreenshot={paymentScreenshot} 
          onScreenshotChange={setPaymentScreenshot} 
          paymentDetails={paymentDetails} 
          onPaymentDetailsChange={setPaymentDetails} 
        />;
      case 3:
        return <OrderConfirmation orderDetails={{
          selectedPackage: "iftar",
          companions: [],
          customerInfo,
          paymentMethod,
          orderNumber,
        }} />;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        {/* Hero Image */}
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-32 sm:h-40 md:h-48">
          <img src={heroImage} alt="رحلة القاهرة - Cairo Trip" className="w-full h-[166%] object-[center_100%] object-cover" />
        </div>

        {/* Header Card - Only show on first step */}
        {currentStep === 1 && (
          <div className="gform-card p-4 sm:p-5 mb-4" dir="rtl">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg sm:text-xl font-black text-primary tracking-tight">
                إفطار حاسبات طنطا
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Ramadan 2026</span>
            </div>
            <p className="text-muted-foreground text-xs mb-3">
              📅 الأربعاء 11 مارس
            </p>
            
            <div className="space-y-2 bg-white/[0.03] p-3 rounded-lg border border-white/5 text-[13px] leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-primary font-bold text-xs shrink-0 mt-0.5">الوجبة:</span>
                <span className="text-foreground/70">
                  أرز بسمتي - ربع دجاجة - 2 كفتة - 2 سمبوسة - 4 محشي ورق عنب - علبة حلويات (5 قطع) - مشروب غازي - مياه
                </span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-start gap-1.5">
                <span className="text-primary font-bold text-xs shrink-0 mt-0.5">الفعاليات:</span>
                <span className="text-foreground/70">
                  ألعاب لوحية - E-Sports - تنورة - بلايستيشن - تصوير - جوائز - شخصيات - مسابقات
                </span>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between bg-primary/90 px-4 py-3 rounded-xl text-white">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black">270</span>
                <span className="text-sm font-medium text-white/80">جنيه / فرد</span>
              </div>
              <span className="text-[11px] sm:text-xs bg-white/15 px-3 py-1 rounded-full font-medium">
                شامل الوجبة والأنشطة
              </span>
            </div>
          </div>
        )}

        {/* Step Indicator - hide on confirmation */}
        {!showConfirmation && <div className="gform-section p-4 mb-3">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
          </div>}

        {/* Form Content */}
        <div className="gform-section p-4 sm:p-6 md:p-8 mb-3">
          <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px] md:text-base">{renderStep()}</div>

          {/* Navigation Buttons */}
          {currentStep <= totalSteps && <div className="flex justify-between mt-4 pt-3 border-t border-border" dir="rtl">
              <Button variant="ghost" size="sm" onClick={handleBack} disabled={currentStep === 1} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary hover:bg-primary/10">
                <ArrowRight className="w-3.5 h-3.5" />
                رجوع
              </Button>

              <Button size="sm" onClick={handleNext} disabled={!canProceed() || isSubmitting} className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    {currentStep === totalSteps ? "إرسال" : "التالي"}
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>}

          {currentStep > totalSteps && <div className="mt-4 pt-3 border-t border-border text-center">
              <Button variant="outline" size="sm" onClick={() => {
            setCurrentStep(1);
            setSelectedPackage(null);
            setCompanions([]);
            setCustomerInfo({
              name: "",
              phone: "",
              year: "",
              companionsCount: 0
            });
            setPaymentMethod(null);
            setPaymentScreenshot(null);
            setPaymentDetails({
              transactionNumber: "",
              senderPhone: "",
              senderName: ""
            });
            localStorage.removeItem(storageKey);
          }} className="text-sm text-primary bg-gray-100 border-0 hover:bg-primary hover:text-white">
                حجز آخر
              </Button>
            </div>}
        </div>

        {/* Footer */}
        
      </div>
    </div>;
};
export default Index;