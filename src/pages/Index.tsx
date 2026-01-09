import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/cairo-trip-hero.webp";
import StepIndicator from "@/components/StepIndicator";
import PackageSelection, { PackageType } from "@/components/PackageSelection";
import TicketQuantity, { Companion } from "@/components/TicketQuantity";
import CustomerInfo from "@/components/CustomerInfo";
import PaymentUpload, { PaymentMethod, PaymentDetails } from "@/components/PaymentUpload";
import OrderConfirmation from "@/components/OrderConfirmation";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cairo-trip-booking";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).currentStep || 1 : 1;
  });
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).selectedPackage || "with-ski" : "with-ski";
  });
  const [companions, setCompanions] = useState<Companion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).companions || [] : [];
  });
  const [customerInfo, setCustomerInfo] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).customerInfo || {
      name: "",
      phone: "",
      nationalId: "",
      year: ""
    } : {
      name: "",
      phone: "",
      nationalId: "",
      year: ""
    };
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).paymentMethod || null : null;
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).paymentDetails || {
      transactionNumber: "",
      senderPhone: "",
      senderName: ""
    } : {
      transactionNumber: "",
      senderPhone: "",
      senderName: ""
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      currentStep,
      selectedPackage,
      companions,
      customerInfo,
      paymentMethod,
      paymentDetails
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [currentStep, selectedPackage, companions, customerInfo, paymentMethod, paymentDetails]);
  const totalSteps = 4;
  const stepLabels = ["الباكدج", "التذاكر", "البيانات", "الدفع"];
  const showConfirmation = currentStep === 5;
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== null;
      case 2:
        return true;
      // Always at least 1 student ticket
      case 3:
        return customerInfo.name.trim() !== "" && customerInfo.phone.trim().length === 11 && customerInfo.nationalId.trim().length === 14 && customerInfo.year !== "";
      case 4:
        const hasRequiredDetails = paymentMethod === "instapay" ? paymentDetails.senderName.trim() !== "" : paymentDetails.senderPhone.trim().length === 11;
        return paymentMethod !== null && paymentScreenshot !== null && paymentDetails.transactionNumber.trim() !== "" && hasRequiredDetails;
      default:
        return true;
    }
  };
  const handleNext = () => {
    if (currentStep <= totalSteps && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PackageSelection selectedPackage={selectedPackage} onSelect={setSelectedPackage} />;
      case 2:
        return <TicketQuantity selectedPackage={selectedPackage} companions={companions} onCompanionsChange={setCompanions} />;
      case 3:
        return <CustomerInfo customerInfo={customerInfo} onCustomerInfoChange={setCustomerInfo} />;
      case 4:
        return <PaymentUpload selectedPackage={selectedPackage} companions={companions} selectedMethod={paymentMethod} onMethodSelect={setPaymentMethod} paymentScreenshot={paymentScreenshot} onScreenshotChange={setPaymentScreenshot} paymentDetails={paymentDetails} onPaymentDetailsChange={setPaymentDetails} />;
      case 5:
        return <OrderConfirmation orderDetails={{
          selectedPackage,
          companions,
          customerInfo,
          paymentMethod
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
          <div className="gform-card p-3 sm:p-4 mb-3" dir="rtl">
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">
              رحلة القاهرة
            </h1>
            <ul className="space-y-1 text-foreground text-xs sm:text-sm">
              <li className="flex items-start gap-1.5">
                <span className="text-foreground">•</span>
                <span>(المتحف المصري الكبير - مول مصر - سكي ايجيبت "اختياري" - شارع المعز)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-foreground">•</span>
                <span>سعر تيكت الرحلة للطلاب من كل المراحل العمرية = 310 ج</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-foreground">•</span>
                <span>سعر تيكت الرحلة لغير الطلاب = 410 ج</span>
              </li>
              <li className="flex items-start gap-1.5">
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
        <div className="gform-section p-4 sm:p-6 mb-3">
          <div className="min-h-[300px] sm:min-h-[350px]">{renderStep()}</div>

          {/* Navigation Buttons */}
          {currentStep <= totalSteps && <div className="flex justify-between mt-4 pt-3 border-t border-border" dir="rtl">
              <Button variant="ghost" size="sm" onClick={handleBack} disabled={currentStep === 1} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary hover:bg-primary/10">
                <ArrowRight className="w-3.5 h-3.5" />
                رجوع
              </Button>

              <Button size="sm" onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90">
                {currentStep === totalSteps ? "إرسال" : "التالي"}
                <ArrowLeft className="w-3.5 h-3.5" />
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
            localStorage.removeItem(STORAGE_KEY);
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