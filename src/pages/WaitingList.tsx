import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WaitingList = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = name.trim() !== "" && phone.trim().length === 11;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waiting_list").insert({
        name: name.trim(),
        phone: phone.trim(),
        selected_package: "tshirt",
        batch: 4,
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast.success("تم تسجيلك في قائمة الانتظار بنجاح!");
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-8 sm:py-12 flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-border/50 animate-in zoom-in-95 duration-300" dir="rtl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">تم تسجيلك بنجاح!</h2>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base">
              تم إضافتك لقائمة الانتظار، هنتواصل معاك في أقرب وقت لو توفرت كمية إضافية من التيشرتات.
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-border/60 hover:bg-gray-50 font-medium"
              onClick={() => {
                setIsSubmitted(false);
                setName("");
                setPhone("");
              }}
            >
              تسجيل شخص آخر
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12 flex flex-col items-center justify-center">
      <div className="container max-w-md mx-auto px-4 w-full">
        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Logo" className="h-14 w-auto mx-auto mb-6 drop-shadow-sm" />
          <div className="inline-flex items-center justify-center gap-2 bg-amber-100/50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 border border-amber-200/50">
            <Clock className="w-4 h-4" />
            <span>قائمة الانتظار</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">الكمية الحالية خلصت!</h1>
          <p className="text-gray-500 text-sm sm:text-base px-4">
            سجل بياناتك دلوقتي وهنكون أول حد نكلمه لما نفتح الحجز للدفعة الجديدة.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-border/50 shadow-black/5" dir="rtl">
          <div className="space-y-5">
            <div className="space-y-2 text-right">
              <Label className="text-sm font-semibold text-gray-700">الاسم رباعي <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك رباعي"
                className="h-12 rounded-xl bg-gray-50/50 border-border/60 focus:bg-white transition-colors text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label className="text-sm font-semibold text-gray-700">رقم الواتساب <span className="text-red-500">*</span></Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="01xxxxxxxxx"
                maxLength={11}
                dir="ltr"
                className={`h-12 rounded-xl bg-gray-50/50 border-border/60 focus:bg-white transition-colors text-left font-mono text-lg ${phone.length > 0 && phone.length < 11 ? "border-red-500/50 focus-visible:ring-red-500/20" : ""}`}
              />
              {phone.length > 0 && phone.length < 11 && (
                <p className="text-xs text-red-500 font-medium">الرقم لازم يكون 11 رقم ({phone.length}/11)</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full h-14 rounded-xl text-base font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin ml-2" />جاري التسجيل...</>
              ) : (
                <>سجل في قائمة الانتظار <ArrowLeft className="w-5 h-5 mr-2" /></>
              )}
            </Button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-6 font-medium tracking-wide uppercase">
          FCI Tanta T-Shirts • Batch 4
        </p>
      </div>
    </div>
  );
};

export default WaitingList;
