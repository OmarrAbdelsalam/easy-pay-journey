import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/cairo-trip-hero.webp";
import StepIndicator from "@/components/StepIndicator";
import PackageSelection, { PackageType, packages } from "@/components/PackageSelection";
import TicketQuantity, { Companion } from "@/components/TicketQuantity";
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
  
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(() => {
    return savedData?.selectedPackage || "with-ski";
  });
  
  const [companions, setCompanions] = useState<Companion[]>(() => {
    return savedData?.companions || [];
  });
  
  const [customerInfo, setCustomerInfo] = useState(() => {
    return savedData?.customerInfo || {
      name: "",
      phone: "",
      nationalId: "",
      year: ""
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
  const totalSteps = 4;
  const stepLabels = ["الباكدج", "التذاكر", "البيانات", "الدفع"];
  const showConfirmation = currentStep === 5;
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== null;
      case 2:
        return !hasCompanionPending; // مينفعش يكمل لو في مرافق لسه بيتضاف
      case 3:
        const baseValidation = customerInfo.name.trim() !== "" && customerInfo.phone.trim().length === 11 && customerInfo.nationalId.trim().length === 14;
        // الخريجين مش محتاجين السنة الدراسية
        return isGrad ? baseValidation : (baseValidation && customerInfo.year !== "");
      case 4:
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
      const generatedOrderNumber = `CT-${Date.now().toString(36).toUpperCase()}`;
      
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
      const studentPkg = packages.find(p => p.id === selectedPackage);
      // لو خريج/معيد يدفع سعر nonStudentPrice
      const mainTicketPrice = isGrad 
        ? (studentPkg?.nonStudentPrice || 0) 
        : (studentPkg?.studentPrice || 0);
      const companionsTotal = companions.reduce((sum, c) => {
        const pkg = packages.find(p => p.id === c.packageType);
        
        if (c.type === "student" || c.type === "child" || c.type === "senior") {
          return sum + (pkg?.studentPrice || 0);
        } else {
          // خريجين فقط
          return sum + (pkg?.nonStudentPrice || 0);
        }
      }, 0);
      const totalPrice = mainTicketPrice + companionsTotal;
      
      // Prepare companions details
      const companionsDetails = companions.map((c, index) => ({
        index: index + 1,
        type: c.type,
        packageType: c.packageType
      }));
      
      console.log('Companions:', companions);
      console.log('Companions Details to save:', companionsDetails);
      
      // Insert booking
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          order_number: generatedOrderNumber,
          selected_package: selectedPackage,
          student_tickets: 1,
          companion_tickets: companions.length,
          companions_details: companionsDetails.length > 0 ? companionsDetails : null,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_national_id: customerInfo.nationalId,
          customer_year: customerInfo.year,
          payment_method: paymentMethod || '',
          transaction_number: paymentDetails.transactionNumber,
          sender_phone: paymentDetails.senderPhone || null,
          sender_name: paymentDetails.senderName || null,
          payment_screenshot_url: urlData.publicUrl,
          total_price: totalPrice,
          booking_type: isGrad ? 'grad' : 'student',
          batch: 2 // الفوج التاني - 15 فبراير
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
        return <PackageSelection selectedPackage={selectedPackage} onSelect={setSelectedPackage} isGrad={isGrad} />;
      case 2:
        return <TicketQuantity selectedPackage={selectedPackage} companions={companions} onCompanionsChange={setCompanions} onPendingChange={setHasCompanionPending} isGrad={isGrad} />;
      case 3:
        return <CustomerInfo customerInfo={customerInfo} onCustomerInfoChange={setCustomerInfo} isGrad={isGrad} />;
      case 4:
        return <PaymentUpload selectedPackage={selectedPackage} companions={companions} selectedMethod={paymentMethod} onMethodSelect={setPaymentMethod} paymentScreenshot={paymentScreenshot} onScreenshotChange={setPaymentScreenshot} paymentDetails={paymentDetails} onPaymentDetailsChange={setPaymentDetails} isGrad={isGrad} />;
      case 5:
        return <OrderConfirmation orderDetails={{
          selectedPackage,
          companions,
          customerInfo,
          paymentMethod,
          orderNumber,
          isGrad
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
          <div className="gform-card p-3 sm:p-4 md:p-5 mb-3" dir="rtl">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div>
                <p className="text-xs text-primary font-medium mb-1">
                  {isGrad ? "للمعيدين والخريجين" : "للطلبة"} - 📅 السبت 15 فبراير 2025
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                  رحلة القاهرة - الفوج التاني
                </h1>
              </div>
              <Link 
                to={isGrad ? "/" : "/grads"} 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {isGrad ? "طالب؟" : "معيد أو خريج؟"}
              </Link>
            </div>
            <ul className="space-y-1 md:space-y-2 text-foreground text-xs sm:text-sm md:text-base">
              <li className="flex items-start gap-1.5 md:gap-2">
                <span className="text-foreground">•</span>
                <span>(المتحف المصري الكبير - مول مصر - سكي ايجيبت "اختياري" - شارع المعز)</span>
              </li>
              <li className="flex items-start gap-1.5 md:gap-2">
                <span className="text-foreground">•</span>
                <span>سعر تيكت الرحلة {isGrad ? "للمعيدين والخريجين" : "للطلاب من كل المراحل العمرية"} = {isGrad ? "410" : "310"} ج</span>
              </li>
           
              <li className="flex items-start gap-1.5 md:gap-2">
                <span className="text-foreground">•</span>
                <span>سعر تيكت سكي ايجيبت + 350ج بدل 700 </span>
              </li>
            </ul>
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
              nationalId: "",
              year: ""
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