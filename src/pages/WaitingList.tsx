import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle, Snowflake, Building2 } from "lucide-react";
import heroImage from "@/assets/cairo-trip-hero.webp";
import skiEgypt1 from "@/assets/ski-egypt-1.png";
import skiEgypt2 from "@/assets/ski-egypt-2.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PackageType = "with-ski" | "without-ski";

const packages = [
  {
    id: "without-ski" as PackageType,
    title: "رحلة القاهرة",
    icon: <Building2 className="w-5 h-5" />,
    studentPrice: 310,
    nonStudentPrice: 410,
    description: "المتحف المصري الكبير - مول مصر - شارع المعز",
  },
  {
    id: "with-ski" as PackageType,
    title: "رحلة القاهرة + Ski Egypt",
    icon: <Snowflake className="w-5 h-5" />,
    studentPrice: 660,
    nonStudentPrice: 760,
    description: "المتحف المصري الكبير - مول مصر - Ski Egypt - شارع المعز",
    highlight: true,
    savings: "وفر 350ج!",
    images: [skiEgypt1, skiEgypt2],
  },
];

const WaitingList = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("with-ski");
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
        selected_package: selectedPackage,
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
          <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-32 sm:h-40 md:h-48">
            <img src={heroImage} alt="رحلة القاهرة" className="w-full h-[166%] object-[center_100%] object-cover" />
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
          <img src={heroImage} alt="رحلة القاهرة" className="w-full h-[166%] object-[center_100%] object-cover" />
        </div>

        {/* Header */}
        <div className="gform-card p-3 sm:p-4 md:p-5 mb-3" dir="rtl">
          <div className="mb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">رحلة القاهرة</h1>
            <p className="text-sm text-muted-foreground">قائمة الانتظار</p>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-3">
            <p className="text-gray-700 text-sm">
              ⚠️ للأسف الأماكن اكتملت حالياً، لكن سجل في قائمة الانتظار وهنتواصل معاك لو حد لغى
            </p>
          </div>

          <ul className="space-y-1 md:space-y-2 text-foreground text-xs sm:text-sm md:text-base">
            <li className="flex items-start gap-1.5 md:gap-2">
              <span className="text-foreground">•</span>
              <span>(المتحف المصري الكبير - مول مصر - سكي ايجيبت "اختياري" - شارع المعز)</span>
            </li>
            <li className="flex items-start gap-1.5 md:gap-2">
              <span className="text-foreground">•</span>
              <span>سعر تيكت الرحلة للطلاب = 310ج</span>
            </li>
            <li className="flex items-start gap-1.5 md:gap-2">
              <span className="text-foreground">•</span>
              <span>سعر تيكت سكي ايجيبت + 350ج بدل 700</span>
            </li>
          </ul>
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

            {/* اختيار الباكدج */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                اختار الباكدج المفضل <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                      }`}
                    >
                      {pkg.highlight && (
                        <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                          {pkg.savings}
                        </span>
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{pkg.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>

                          {pkg.images && (
                            <div className="flex gap-2 mb-3">
                              {pkg.images.map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`Ski Egypt ${index + 1}`}
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          )}

                          <div className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">السعر للطلاب:</span>
                            <span className="font-bold text-foreground">{pkg.studentPrice}ج</span>
                            {pkg.highlight && (
                              <span className="text-destructive line-through">{pkg.studentPrice + 350}ج</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
