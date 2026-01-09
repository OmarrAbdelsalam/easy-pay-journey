import { useState } from "react";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-trip.jpg";
import StepIndicator from "@/components/StepIndicator";
import ParticipantType from "@/components/ParticipantType";
import PackageSelection, { PackageType } from "@/components/PackageSelection";
import CustomerForm from "@/components/CustomerForm";
import PaymentSelection, { PaymentMethod } from "@/components/PaymentSelection";
import OrderConfirmation from "@/components/OrderConfirmation";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [participantType, setParticipantType] = useState<"student" | "non-student" | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    nationalId: "",
    year: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [transactionRef, setTransactionRef] = useState("");

  const totalSteps = 5;
  const stepLabels = ["النوع", "الباكدج", "البيانات", "الدفع", "التأكيد"];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return participantType !== null;
      case 2:
        return selectedPackage !== null;
      case 3:
        const hasBasicInfo = customerInfo.name.trim() !== "" && 
                            customerInfo.phone.trim() !== "" && 
                            customerInfo.nationalId.trim().length === 14;
        if (participantType === "student") {
          return hasBasicInfo && customerInfo.year !== "";
        }
        return hasBasicInfo;
      case 4:
        return paymentMethod !== null && transactionRef.trim() !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ParticipantType
            selectedType={participantType}
            onSelect={setParticipantType}
          />
        );
      case 2:
        return (
          <PackageSelection
            selectedPackage={selectedPackage}
            onSelect={setSelectedPackage}
            participantType={participantType}
          />
        );
      case 3:
        return (
          <CustomerForm
            participantType={participantType}
            selectedPackage={selectedPackage}
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
          />
        );
      case 4:
        return (
          <PaymentSelection
            selectedMethod={paymentMethod}
            onSelect={setPaymentMethod}
            transactionRef={transactionRef}
            onTransactionRefChange={setTransactionRef}
          />
        );
      case 5:
        return (
          <OrderConfirmation
            orderDetails={{
              participantType: participantType!,
              selectedPackage,
              customerInfo,
              paymentMethod,
              transactionRef,
            }}
          />
        );
      default:
        return null;
    }
  };

  const destinations = [
    "المتحف المصري الكبير",
    "مول مصر",
    "Ski Egypt (اختياري)",
    "شارع المعز",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt="رحلة القاهرة"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              رحلة القاهرة 🏛️
            </h1>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {destinations.map((dest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full"
                >
                  <MapPin className="w-3 h-3" />
                  {dest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container max-w-2xl mx-auto px-4 py-8 -mt-8 relative z-10">
        <div className="form-card">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={stepLabels}
          />

          <div className="min-h-[400px]">{renderStep()}</div>

          {/* Navigation Buttons */}
          {currentStep < totalSteps && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border" dir="rtl">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {currentStep === 4 ? "تأكيد الحجز" : "التالي"}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStep === totalSteps && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setParticipantType(null);
                  setSelectedPackage(null);
                  setCustomerInfo({ name: "", phone: "", nationalId: "", year: "" });
                  setPaymentMethod(null);
                  setTransactionRef("");
                }}
              >
                حجز رحلة جديدة
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          للاستفسار تواصل معانا على{" "}
          <a href="tel:01012345678" className="text-primary hover:underline" dir="ltr">
            01012345678
          </a>
        </p>
      </div>
    </div>
  );
};

export default Index;
