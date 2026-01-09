import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/cairo-trip-hero.webp";
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

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        {/* Hero Image */}
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm">
          <img
            src={heroImage}
            alt="رحلة القاهرة - Cairo Trip"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Header Card */}
        <div className="gform-card p-4 sm:p-6 mb-3" dir="rtl">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
            رحلة القاهرة
          </h1>
          <ul className="space-y-2 text-foreground text-sm sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              <span>(المتحف المصري الكبير - مول مصر - سكي ايجيبت "اختياري" - شارع المعز)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              <span>سعر تيكت الرحلة للطلاب من كل المراحل العمرية = 310 ج</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              <span>سعر تيكت الرحلة لغير الطلاب = 410 ج</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              <span>سعر تيكت سكي ايجيبت + 350ج على تيكت الرحلة الأساسية</span>
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground text-sm">
            بدل + 700ج
          </p>
          <p className="mt-6 text-destructive text-sm">
            * تشير إلى أنّ السؤال مطلوب
          </p>
        </div>

        {/* Step Indicator */}
        <div className="gform-section p-4 mb-3">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={stepLabels}
          />
        </div>

        {/* Form Content */}
        <div className="gform-section p-4 sm:p-6 mb-3">
          <div className="min-h-[300px] sm:min-h-[350px]">{renderStep()}</div>

          {/* Navigation Buttons */}
          {currentStep < totalSteps && (
            <div className="flex justify-between mt-6 pt-4 border-t border-border" dir="rtl">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                {currentStep === 4 ? "تأكيد الحجز" : "التالي"}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStep === totalSteps && (
            <div className="mt-6 pt-4 border-t border-border text-center">
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
                className="text-primary border-primary hover:bg-primary/10"
              >
                حجز رحلة جديدة
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-4" dir="rtl">
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
