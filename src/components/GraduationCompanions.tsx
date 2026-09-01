import React from "react";
import { Users, Info, Sparkles, CheckCircle2 } from "lucide-react";

interface GraduationCompanionsProps {
  companionsCount: number | string;
  onCompanionsCountChange: (count: number | string) => void;
  totalPrice: number;
}

export const COMPANION_OPTIONS = [
  { value: 0, label: "0 مرافق", text: "بدون مرافقين (شامل الخريج والباكدج فقط)" },
  { value: 1, label: "1 مرافق", text: "مرافق واحد مجاناً (ضمن تذكرة الـ 1100 ج)" },
  { value: 2, label: "2 مرافقين", text: "2 مرافقين مجاناً (الحد الأقصى المجاني)" },
];

export const calculateGraduationPrice = (companions: number | string): number => {
  const basePrice = 1100;
  if (typeof companions === "string" || companions <= 2) {
    return basePrice;
  }
  const extraCount = companions - 2;
  return basePrice + extraCount * 220;
};

export const GraduationCompanions: React.FC<GraduationCompanionsProps> = ({
  companionsCount,
  onCompanionsCountChange,
  totalPrice,
}) => {
  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      <div className="border-b border-border/80 pb-3">
        <h3 className="text-xl font-black text-primary flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          الخطوة 2: عدد المرافقين والإضافات
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          تذكرة الخريج (650 ج) تتضمن رسمياً حضور الخريج + 2 مرافق مجاني.
        </p>
      </div>

      {/* Main Question Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right space-y-2">
        <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm sm:text-base">
          <Info className="w-5 h-5 shrink-0 text-amber-600" />
          <span>عدد المرافقين المتوقع (الرئيسي + الإضافي) <span className="text-destructive">*</span></span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pr-7">
          سعر إضافة مرافق إضافي <strong>160 ج</strong>. مع العلم أن المبلغ الأساسي (650 ج) شامل 2 مرافقين مجاناً.
          <br />
          <span className="text-xs text-muted-foreground font-medium">
            (مثال: لو كان عدد المرافقين معاك 3، هتسدد 160 ج فقط زيارة = إجمالي 810 ج).
          </span>
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
          اختر عدد المرافقين المتوقع:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {COMPANION_OPTIONS.map((opt) => {
            const isSelected = companionsCount === opt.value;
            return (
              <div
                key={String(opt.value)}
                onClick={() => onCompanionsCountChange(opt.value)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md scale-[1.01]"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3 text-right">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 fill-current" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-foreground block">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {opt.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Summary Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-amber-500/10 to-primary/15 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-right">
          <span className="text-xs text-muted-foreground font-bold block">إجمالي المبلغ المطلوب سداده:</span>
          <span className="text-xs text-primary font-medium">
            (تذكرة الخريج 650 ج + المرافقين الإضافيين)
          </span>
        </div>
        <div className="text-2xl font-black text-primary font-mono tracking-tight">
          {totalPrice} <span className="text-sm font-bold text-foreground">جنيه</span>
        </div>
      </div>

      {/* Extra Notice regarding Gown / Addon Form */}
      <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1 text-right">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>📑 تنبيه هام بشأن الإضافات والمرافقين:</span>
        </div>
        <p className="leading-relaxed pr-5">
          سيتم لاحقاً فتح <strong>فورم خاص بالإضافات</strong> لطلب أية إضافات اختياريّة حسب رغبتك (مثل: درع أكرليك/كريستال، الوشاح المثلث، الطباعة والتطريز على الكاب، أو مرافقين إضافيين).
        </p>
      </div>
    </div>
  );
};

export default GraduationCompanions;
