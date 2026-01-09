import { useState } from "react";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-trip.jpg";
import StepIndicator from "@/components/StepIndicator";
import PackageSelection, { PackageType } from "@/components/PackageSelection";
import TicketQuantity from "@/components/TicketQuantity";
import CustomerInfo from "@/components/CustomerInfo";
import PaymentUpload, { PaymentMethod } from "@/components/PaymentUpload";
import OrderConfirmation from "@/components/OrderConfirmation";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [studentTickets, setStudentTickets] = useState(0);
  const [nonStudentTickets, setNonStudentTickets] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    nationalId: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  const totalSteps = 5;
  const stepLabels = ["الباكدج", "التذاكر", "البيانات", "الدفع", "التأكيد"];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== null;
      case 2:
        return studentTickets > 0 || nonStudentTickets > 0;
      case 3:
        return (
          customerInfo.name.trim() !== "" &&
          customerInfo.phone.trim() !== "" &&
          customerInfo.nationalId.trim().length === 14
        );
      case 4:
        return paymentMethod !== null && paymentScreenshot !== null;
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
          <PackageSelection
            selectedPackage={selectedPackage}
            onSelect={setSelectedPackage}
          />
        );
      case 2:
        return (
          <TicketQuantity
            selectedPackage={selectedPackage}
            studentTickets={studentTickets}
            nonStudentTickets={nonStudentTickets}
            onStudentTicketsChange={setStudentTickets}
            onNonStudentTicketsChange={setNonStudentTickets}
          />
        );
      case 3:
        return (
          <CustomerInfo
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
          />
        );
      case 4:
        return (
          <PaymentUpload
            selectedPackage={selectedPackage}
            studentTickets={studentTickets}
            nonStudentTickets={nonStudentTickets}
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
            paymentScreenshot={paymentScreenshot}
            onScreenshotChange={setPaymentScreenshot}
          />
        );
      case 5:
        return (
          <OrderConfirmation
            orderDetails={{
              selectedPackage,
              studentTickets,
              nonStudentTickets,
              customerInfo,
              paymentMethod,
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
                  setSelectedPackage(null);
                  setStudentTickets(0);
                  setNonStudentTickets(0);
                  setCustomerInfo({ name: "", phone: "", nationalId: "" });
                  setPaymentMethod(null);
                  setPaymentScreenshot(null);
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
