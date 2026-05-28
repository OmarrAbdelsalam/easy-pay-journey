import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import TshirtInfo from "@/components/TshirtInfo";
import TshirtCustomer from "@/components/TshirtCustomer";
import PaymentUpload, { PaymentMethod, PaymentDetails } from "@/components/PaymentUpload";
import TshirtConfirmation from "@/components/TshirtConfirmation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "tshirt-semi-senior-booking";

const Index = ({ defaultBatchType }: { defaultBatchType?: "Senior" | "Semi-Senior" }) => {
  const navigate = useNavigate();
  const getSavedData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  const savedData = getSavedData();

  const [batchType, setBatchType] = useState<"Senior" | "Semi-Senior" | null>(
    () => defaultBatchType || savedData?.batchType || null
  );

  const images = batchType === "Senior" 
    ? ["/image (71).webp", "/image (72).webp"] 
    : ["/image (64).webp", "/image (65).webp"];

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (savedData?.isCompleted && savedData?.orderNumber) return 4;
    return 1;
  });

  useEffect(() => {
    if (defaultBatchType && batchType !== defaultBatchType) {
      setBatchType(defaultBatchType);
      setCurrentStep(1);
    }
  }, [defaultBatchType]);

  const [orderInfo, setOrderInfo] = useState(() =>
    savedData?.orderInfo || {
      name: "",
      phone: "",
      size: "",
      sleeveType: "",
      addonIce: false,
      addonName: false,
      customName: "",
    }
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => savedData?.paymentMethod || null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() =>
    savedData?.paymentDetails || { transactionNumber: "", senderPhone: "", senderName: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(() => savedData?.orderNumber || null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const totalSteps = 3;
  const stepLabels = ["التيشرت", "البيانات", "الدفع"];
  const showConfirmation = currentStep === 4;

  // Calculate dynamic price
  const totalPrice = useMemo(() => {
    if (!orderInfo.sleeveType) return 0;
    
    let price = 0;
    if (batchType === "Senior") {
      price = orderInfo.sleeveType === "كم طويل" ? 165 : 155;
      if (orderInfo.addonIce) price += 35;
    } else {
      price = orderInfo.sleeveType === "كم طويل" ? 295 : 275;
      if (orderInfo.addonName) price += 25;
    }
    
    return price;
  }, [orderInfo.sleeveType, orderInfo.addonIce, orderInfo.addonName, batchType]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Swipe left (next)
    const isRightSwipe = distance < -50; // Swipe right (prev)
    
    if (isLeftSwipe || isRightSwipe) {
      if (isLeftSwipe) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dataToSave = {
      batchType,
      currentStep,
      orderInfo,
      paymentMethod,
      paymentDetails,
      orderNumber,
      isCompleted: currentStep === 4 && orderNumber !== null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [batchType, currentStep, orderInfo, paymentMethod, paymentDetails, orderNumber]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (batchType === "Senior") {
          return orderInfo.size !== "" && orderInfo.sleeveType !== "";
        } else {
          const isAddonValid = orderInfo.addonName ? (orderInfo.customName || "").trim() !== "" : true;
          return orderInfo.size !== "" && orderInfo.sleeveType !== "" && isAddonValid;
        }
      case 2:
        return (
          orderInfo.name.trim() !== "" &&
          orderInfo.phone.trim().length === 11
        );
      case 3:
        const hasRequiredDetails =
          paymentMethod === "instapay"
            ? paymentDetails.senderName.trim() !== ""
            : paymentDetails.senderPhone.trim().length === 11;
        return (
          paymentMethod !== null &&
          paymentScreenshot !== null &&
          paymentDetails.transactionNumber.trim() !== "" &&
          hasRequiredDetails
        );
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep <= totalSteps && canProceed()) {
      if (currentStep === totalSteps) {
        await submitBooking();
      } else {
        setCurrentStep((prev: number) => prev + 1);
      }
    }
  };

  const submitBooking = async () => {
    if (!paymentScreenshot) return;
    setIsSubmitting(true);
    try {
      const generatedOrderNumber = `TSH-${Date.now().toString(36).toUpperCase()}`;

      const fileExt = paymentScreenshot.name.split(".").pop();
      const fileName = `${generatedOrderNumber}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, paymentScreenshot);

      if (uploadError) throw new Error("فشل في رفع صورة التحويل");

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      const productDetails = [
        { type: "size", value: orderInfo.size },
        { type: "sleeve", value: orderInfo.sleeveType },
      ];
      if (batchType === "Senior") {
        productDetails.push({ type: "addon_ice", value: orderInfo.addonIce ? "Yes" : "No" });
      } else {
        productDetails.push({ type: "addon_name", value: orderInfo.addonName ? orderInfo.customName : "None" });
      }

      const { error: insertError } = await supabase.from("bookings").insert({
        order_number: generatedOrderNumber,
        selected_package: "tshirt",
        student_tickets: 1, // Quantity
        companion_tickets: (batchType === "Senior" ? orderInfo.addonIce : orderInfo.addonName) ? 1 : 0, // Using this to indicate if addon is selected
        companions_details: productDetails,
        customer_name: orderInfo.name,
        customer_phone: orderInfo.phone,
        customer_national_id: `${orderInfo.sleeveType} | ${orderInfo.size}`, // Fallback for easier viewing in dashboard
        customer_year: batchType,
        payment_method: paymentMethod || "",
        transaction_number: paymentDetails.transactionNumber,
        sender_phone: paymentDetails.senderPhone || null,
        sender_name: paymentDetails.senderName || null,
        payment_screenshot_url: urlData.publicUrl,
        total_price: totalPrice,
        booking_type: "tshirt",
        batch: 4,
      });

      if (insertError) throw new Error("فشل في حفظ الحجز");

      setOrderNumber(generatedOrderNumber);
      setCurrentStep(4);
      toast.success("تم تأكيد طلبك بنجاح!");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev: number) => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TshirtInfo orderInfo={orderInfo} onOrderInfoChange={setOrderInfo} batchType={batchType} />;
      case 2:
        return <TshirtCustomer orderInfo={orderInfo} onOrderInfoChange={setOrderInfo} />;
      case 3:
        return (
          <PaymentUpload
            selectedPackage="tshirt"
            companions={[]}
            companionsCount={0}
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
            paymentScreenshot={paymentScreenshot}
            onScreenshotChange={setPaymentScreenshot}
            paymentDetails={paymentDetails}
            onPaymentDetailsChange={setPaymentDetails}
            totalOverride={totalPrice}
          />
        );
      case 4:
        return (
          <TshirtConfirmation
            orderInfo={orderInfo}
            paymentMethod={paymentMethod}
            orderNumber={orderNumber}
          />
        );
      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      {!batchType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-xl text-center border border-border/50 zoom-in-95 animate-in duration-200" dir="rtl">
            <img src="/logo.webp" alt="Logo" className="h-12 w-auto mx-auto mb-6" />
            <h2 className="text-xl font-black mb-6 tracking-tight">أهلاً بيك! اختار دفعتك</h2>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/senior')} 
                className="h-14 text-lg rounded-xl shadow-sm hover:scale-[1.02] transition-all bg-primary"
              >
                Senior
              </Button>
              <Button 
                onClick={() => navigate('/semi-senior')} 
                className="h-14 text-lg rounded-xl shadow-sm hover:scale-[1.02] transition-all border-border/60 hover:bg-muted/50" 
                variant="outline"
              >
                Semi-Senior
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        {/* Brand Header Logos */}
        <div className="flex items-center justify-between mb-6 px-1">
          <img src="/logo.webp" alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
          <img src="/logo2.webp" alt="Logo 2" className="h-10 sm:h-12 w-auto object-contain" />
        </div>

        {/* Hero Image Slider */}
        {!showConfirmation && (
          <div 
            className="relative mb-6 rounded-2xl overflow-hidden bg-muted/30 border border-border aspect-[2/1] flex items-center justify-center cursor-pointer touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
          >
            {images.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={`T-shirt Preview ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  idx === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              />
            ))}
            {/* Slider Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? "bg-white w-6 shadow-sm" : "bg-white/50 hover:bg-white/80 w-2 shadow-sm"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Header Card */}
        {currentStep === 1 && (
          <div className="py-2 mb-6 flex flex-col items-start text-left" dir="ltr">
            <div className="flex flex-col mb-1.5 w-full">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80 mb-0.5">
                  FCI Tanta
                </span>
                {batchType && (
                  <button 
                    onClick={() => {
                      setBatchType(null);
                      localStorage.removeItem(STORAGE_KEY);
                      navigate('/booking');
                    }} 
                    className="text-[10px] font-bold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                  >
                    تغيير الدفعة
                  </button>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {batchType} T-Shirts
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5 font-sans">
                <span className="text-2xl sm:text-3xl font-black text-primary">
                  {totalPrice > 0 ? totalPrice : (batchType === "Senior" ? "155" : "275")}
                </span>
                <span className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">EGP</span>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {!showConfirmation && (
          <div className="mb-8 px-1">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
          </div>
        )}

        {/* Form Content */}
        <div className="mb-8">
          <div>
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep <= totalSteps && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50" dir="rtl">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary hover:bg-primary/10"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                رجوع
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90"
              >
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
            </div>
          )}

          {currentStep > totalSteps && (
            <div className="mt-4 pt-3 border-t border-border text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentStep(1);
                  setBatchType(null);
                  setOrderInfo({ name: "", phone: "", size: "", sleeveType: "", addonIce: false, addonName: false, customName: "" });
                  setPaymentMethod(null);
                  setPaymentScreenshot(null);
                  setPaymentDetails({ transactionNumber: "", senderPhone: "", senderName: "" });
                  localStorage.removeItem(STORAGE_KEY);
                  navigate('/booking');
                }}
                className="text-sm text-primary bg-gray-100 border-0 hover:bg-primary hover:text-white"
              >
                طلب تيشرت آخر
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
