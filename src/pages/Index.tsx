import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import dawryImage from "/dawry.jpeg";
import StepIndicator from "@/components/StepIndicator";
import TournamentTeamInfo from "@/components/TournamentTeamInfo";
import TournamentPlayers from "@/components/TournamentPlayers";
import PaymentUpload, { PaymentMethod, PaymentDetails } from "@/components/PaymentUpload";
import TournamentConfirmation from "@/components/TournamentConfirmation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "dawry-tournament-booking";
const TEAM_PRICE = 600;

const Index = () => {
  const getSavedData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  const savedData = getSavedData();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (savedData?.isCompleted && savedData?.orderNumber) return 4;
    return 1;
  });

  const [teamInfo, setTeamInfo] = useState(() =>
    savedData?.teamInfo || {
      teamName: "",
      captainName: "",
      captainPhone: "",
      year: "",
      players: ["", "", "", "", ""],
    }
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => savedData?.paymentMethod || null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() =>
    savedData?.paymentDetails || { transactionNumber: "", senderPhone: "", senderName: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(() => savedData?.orderNumber || null);

  const totalSteps = 3;
  const stepLabels = ["بيانات الفريق", "أسماء اللاعبين", "الدفع"];
  const showConfirmation = currentStep === 4;

  useEffect(() => {
    const dataToSave = {
      currentStep,
      teamInfo,
      paymentMethod,
      paymentDetails,
      orderNumber,
      isCompleted: currentStep === 4 && orderNumber !== null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [currentStep, teamInfo, paymentMethod, paymentDetails, orderNumber]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          teamInfo.teamName.trim() !== "" &&
          teamInfo.captainName.trim() !== "" &&
          teamInfo.captainPhone.trim().length === 11 &&
          teamInfo.year !== ""
        );
      case 2:
        return (
          teamInfo.players.length >= 5 &&
          teamInfo.players.every((p: string) => p.trim() !== "")
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
      const generatedOrderNumber = `DWR-${Date.now().toString(36).toUpperCase()}`;

      const fileExt = paymentScreenshot.name.split(".").pop();
      const fileName = `${generatedOrderNumber}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, paymentScreenshot);

      if (uploadError) throw new Error("فشل في رفع صورة التحويل");

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      // Store players list in companions_details
      const companionsDetails = teamInfo.players.map((name: string, index: number) => ({
        index: index + 1,
        name,
        type: "player",
      }));

      const { error: insertError } = await supabase.from("bookings").insert({
        order_number: generatedOrderNumber,
        selected_package: "tournament",
        student_tickets: teamInfo.players.length,
        companion_tickets: 0,
        companions_details: companionsDetails,
        customer_name: teamInfo.captainName,
        customer_phone: teamInfo.captainPhone,
        customer_national_id: teamInfo.teamName,
        customer_year: teamInfo.year,
        payment_method: paymentMethod || "",
        transaction_number: paymentDetails.transactionNumber,
        sender_phone: paymentDetails.senderPhone || null,
        sender_name: paymentDetails.senderName || null,
        payment_screenshot_url: urlData.publicUrl,
        total_price: TEAM_PRICE,
        booking_type: "tournament",
        batch: 4,
      });

      if (insertError) throw new Error("فشل في حفظ الحجز");

      setOrderNumber(generatedOrderNumber);
      setCurrentStep(4);
      toast.success("تم تأكيد تسجيل فريقك بنجاح!");
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
        return <TournamentTeamInfo teamInfo={teamInfo} onTeamInfoChange={setTeamInfo} />;
      case 2:
        return (
          <TournamentPlayers
            players={teamInfo.players}
            onPlayersChange={(players) => setTeamInfo({ ...teamInfo, players })}
          />
        );
      case 3:
        return (
          <PaymentUpload
            selectedPackage="iftar"
            companions={[]}
            companionsCount={0}
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
            paymentScreenshot={paymentScreenshot}
            onScreenshotChange={setPaymentScreenshot}
            paymentDetails={paymentDetails}
            onPaymentDetailsChange={setPaymentDetails}
            totalOverride={TEAM_PRICE}
          />
        );
      case 4:
        return (
          <TournamentConfirmation
            teamInfo={teamInfo}
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
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        {/* Hero Image */}
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-72 sm:h-96 md:h-[420px]">
          <img
            src={dawryImage}
            alt="دوري مين فينا - كلية حاسبات ومعلومات طنطا"
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Header Card */}
        {currentStep === 1 && (
          <div className="gform-card p-4 sm:p-5 mb-4" dir="rtl"
            style={{ background: "linear-gradient(135deg, #a55fa1 0%, #7a3d76 100%)" }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                دوري مين فينا
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                FCI Tanta
              </span>
            </div>
            <p className="text-white/70 text-xs mb-3">
              الأربعاء 8 أبريل
            </p>

            <div className="space-y-2 bg-white/10 p-3 rounded-lg border border-white/15 text-[13px] leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-white font-bold text-xs shrink-0 mt-0.5">الفريق:</span>
                <span className="text-white/80">من 5 إلى 7 لاعبين</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-start gap-1.5">
                <span className="text-white font-bold text-xs shrink-0 mt-0.5">المكان:</span>
                <span className="text-white/80">كلية الحاسبات والمعلومات — جامعة طنطا</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between bg-white/15 px-4 py-3 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white">600</span>
                <span className="text-sm font-medium text-white/70">جنيه / فريق</span>
              </div>
              <span className="text-[11px] sm:text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                اشتراك الفريق كامل
              </span>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {!showConfirmation && (
          <div className="gform-section p-4 mb-3">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
          </div>
        )}

        {/* Form Content */}
        <div className="gform-section p-4 sm:p-6 md:p-8 mb-3">
          <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px] md:text-base">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep <= totalSteps && (
            <div className="flex justify-between mt-4 pt-3 border-t border-border" dir="rtl">
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
                  setTeamInfo({ teamName: "", captainName: "", captainPhone: "", year: "", players: ["", "", "", "", ""] });
                  setPaymentMethod(null);
                  setPaymentScreenshot(null);
                  setPaymentDetails({ transactionNumber: "", senderPhone: "", senderName: "" });
                  localStorage.removeItem(STORAGE_KEY);
                }}
                className="text-sm text-primary bg-gray-100 border-0 hover:bg-primary hover:text-white"
              >
                تسجيل فريق آخر
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
