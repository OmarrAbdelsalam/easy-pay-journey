import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        selected_package: "iftar",
        batch: 3 // إفطار رمضان 2026 - 11 مارس
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("تم تسجيلك في قائمة الانتظار بنجاح!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="container max-w-2xl mx-auto px-3 sm:px-4">
          <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-56 sm:h-72 md:h-80">
            <img src={heroImage} alt="إفطار حاسبات طنطا" className="w-full h-full object-cover object-top" />
          </div>

          <div className="gform-card p-6 sm:p-8 text-center" dir="rtl">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-3">تم التسجيل بنجاح!</h2>
            <p className="text-muted-foreground mb-2">تم إضافتك لقائمة الانتظار</p>
            <p className="text-sm text-muted-foreground">هنتواصل معاك لو في مكان فاضي 🙏</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-32 sm:h-40 md:h-48">
          <img src={heroImage} alt="إفطار حاسبات طنطا" className="w-full h-full object-cover" />
        </div>

        {/* Header */}
        <div className="gform-card p-3 sm:p-4 md:p-5 mb-3" dir="rtl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl font-bold text-white">إفطار حاسبات طنطا</h1>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Ramadan 2026</span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mb-3">📅 الأربعاء 11 مارس</p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
            <p className="text-red-300 text-sm">
              ⚠️ للأسف الأماكن اكتملت حالياً، لكن سجل في قائمة الانتظار وهنتواصل معاك لو حد لغى
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-foreground text-xs">
            <span className="bg-card px-2 py-1 rounded border border-border">🍖 2 كفتة</span>
            <span className="bg-card px-2 py-1 rounded border border-border">🥟 2 سمبوسة</span>
            <span className="bg-card px-2 py-1 rounded border border-border">🫔 4 محشي ورق عنب</span>
            <span className="bg-card px-2 py-1 rounded border border-border">🍬 علبة حلويات (5 قطع)</span>
          </div>
        </div>

        <div className="gform-section p-4 sm:p-6" dir="rtl">
          <div className="space-y-5">
            {/* الاسم */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                الاسم بالكامل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك هنا"
                className="text-right"
              />
            </div>

            {/* رقم الموبايل */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                رقم الموبايل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="01xxxxxxxxx"
                className="text-right"
                dir="ltr"
              />
              {phone && phone.length !== 11 && <p className="text-xs text-red-500">رقم الموبايل لازم يكون 11 رقم</p>}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="w-full bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  سجل في قائمة الانتظار
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingList;
