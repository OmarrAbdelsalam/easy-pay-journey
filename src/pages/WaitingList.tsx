import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import dawryImage from "/dawry.jpeg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WaitingList = () => {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = teamName.trim() !== "" && captainName.trim() !== "" && phone.trim().length === 11;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waiting_list").insert({
        name: teamName.trim() + " - " + captainName.trim(),
        phone: phone.trim(),
        selected_package: "tournament",
        batch: 4,
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast.success("تم تسجيل فريقك في قائمة الانتظار!");
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="container max-w-2xl mx-auto px-3 sm:px-4">
          <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-72 sm:h-96 md:h-[420px]">
            <img src={dawryImage} alt="دوري مين فينا" className="w-full h-full object-cover object-top" />
          </div>
          <div className="gform-card p-6 sm:p-8 text-center" dir="rtl"
            style={{ background: "linear-gradient(135deg, #a55fa1 0%, #7a3d76 100%)" }}>
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">تم تسجيل فريقك!</h2>
            <p className="text-white/80">هنتواصل مع الكابتن لو في مكان فاضي</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-72 sm:h-96 md:h-[420px]">
          <img src={dawryImage} alt="دوري مين فينا" className="w-full h-full object-cover object-top" />
        </div>

        <div className="gform-card p-4 sm:p-5 mb-4" dir="rtl"
          style={{ background: "linear-gradient(135deg, #a55fa1 0%, #7a3d76 100%)" }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl font-bold text-white">دوري مين فينا</h1>
            <span className="text-xs text-white/60 font-bold uppercase tracking-widest">FCI Tanta</span>
          </div>
          <p className="text-white/70 text-xs mb-3">الاربعاء 15 ابريل</p>
          <div className="bg-white/10 border border-white/15 rounded-lg p-3">
            <p className="text-white/90 text-sm">
              الاماكن اكتملت — سجل فريقك في قائمة الانتظار وهنتواصل معاك لو في مكان فاضي
            </p>
          </div>
        </div>

        <div className="gform-section p-4 sm:p-6" dir="rtl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                اسم الفريق <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="اسم الفريق"
                className="gform-input text-right text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                اسم الكابتن (رباعي) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="الاسم رباعي باللغة العربية"
                className="gform-input text-right text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                رقم واتساب الكابتن <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="01xxxxxxxxx"
                maxLength={11}
                className={`gform-input text-sm ${phone.length > 0 && phone.length < 11 ? "border-destructive" : ""}`}
                dir="ltr"
              />
              {phone.length > 0 && phone.length < 11 && (
                <p className="text-xs text-destructive mt-1">الرقم لازم يكون 11 رقم ({phone.length}/11)</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري التسجيل...</>
              ) : (
                <>سجل في قائمة الانتظار<ArrowLeft className="w-4 h-4 mr-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingList;
