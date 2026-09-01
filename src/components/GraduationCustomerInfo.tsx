import React from "react";
import { User, Phone, Sparkles, Shirt } from "lucide-react";

export interface GraduationCustomerData {
  name: string;
  phone: string;
  ticketName: string;
  gownSize: string;
}

interface GraduationCustomerInfoProps {
  data: GraduationCustomerData;
  onChange: (data: GraduationCustomerData) => void;
}

const GOWN_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

export const GraduationCustomerInfo: React.FC<GraduationCustomerInfoProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      <div className="border-b border-border/80 pb-3">
        <h3 className="text-xl font-black text-primary flex items-center gap-2">
          <User className="w-5 h-5 text-amber-500" />
          الخطوة 1: البيانات الشخصية للخريج
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          يرجى التأكد من كتابة الاسم بدقة كما ترغب في أن يظهر بالشهادة وحفل التكريم.
        </p>
      </div>

      {/* 1. Full Arabic Name */}
      <div className="space-y-2">
        <label className="block text-sm font-extrabold text-foreground text-right flex items-center justify-between">
          <span>
            الاسم رباعي (كما يكتب في الشهادة وتتم المناداة به) <span className="text-destructive">*</span>
          </span>
          <span className="text-xs text-muted-foreground font-normal">(لغة عربية)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="أدخل اسمك الرباعي كاملاً باللغة العربية"
            className="gform-input text-right text-base pr-3"
          />
        </div>
      </div>

      {/* 2. Whatsapp Number */}
      <div className="space-y-2">
        <label className="block text-sm font-extrabold text-foreground text-right flex items-center justify-between">
          <span>
            رقم الواتس <span className="text-destructive">*</span>
          </span>
          <span className="text-xs text-muted-foreground font-normal">(11 رقم للتواصل والإشعارات)</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 11);
              onChange({ ...data, phone: val });
            }}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            dir="ltr"
            className={`gform-input text-left text-base font-mono tracking-wider ${
              data.phone.length > 0 && data.phone.length < 11
                ? "border-destructive focus:border-destructive text-destructive"
                : ""
            }`}
          />
        </div>
        {data.phone.length > 0 && data.phone.length < 11 && (
          <p className="text-xs text-destructive mt-1 font-medium">
            يجب أن يتكون رقم الواتساب من 11 رقم ({data.phone.length}/11)
          </p>
        )}
      </div>

      {/* 3. Ticket / Stage Name */}
      <div className="space-y-2">
        <label className="block text-sm font-extrabold text-foreground text-right flex items-center justify-between">
          <span>
            الاسم كما تريد أن يكتب على التيكيت و تتم المناداة به أثناء التكريم <span className="text-destructive">*</span>
          </span>
        </label>
        <input
          type="text"
          value={data.ticketName}
          onChange={(e) => onChange({ ...data, ticketName: e.target.value })}
          placeholder="مثال: د. أحمد محمد / المهندس عمر مصطفى"
          className="gform-input text-right text-base"
        />
        <p className="text-xs text-muted-foreground">
          هذا الاسم هو الذي سيناديك به مقدم الحفل على خشبة المسرح وسيُطبع على التذكرة الرسمية.
        </p>
      </div>

      {/* 4. Gown Size */}
      <div className="space-y-2 pt-2">
        <label className="block text-sm font-extrabold text-foreground text-right flex items-center gap-1.5">
          <Shirt className="w-4 h-4 text-primary" />
          <span>مقاس روب التخرج المقترح <span className="text-destructive">*</span></span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {GOWN_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ ...data, gownSize: size })}
              className={`py-2.5 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                data.gownSize === size
                  ? "bg-primary text-white border-primary shadow-md scale-105"
                  : "bg-muted/40 border-border hover:border-primary/50 text-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraduationCustomerInfo;
