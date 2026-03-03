import { Minus, Plus } from "lucide-react";

interface CustomerInfoProps {
  customerInfo: {
    name: string;
    phone: string;
    year: string;
    companionsCount: number;
  };
  onCustomerInfoChange: (info: any) => void;
  isGrad?: boolean;
}

const CustomerInfo = ({
  customerInfo,
  onCustomerInfoChange,
}: CustomerInfoProps) => {
  const years = ["أولى", "تانية", "تالتة", "رابعة", "خريج"];

  return (
    <div className="animate-fade-in space-y-4 md:space-y-5" dir="rtl">
      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
          الاسم رباعي باللغة العربية <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={customerInfo.name}
          onChange={(e) =>
            onCustomerInfoChange({ ...customerInfo, name: e.target.value })
          }
          placeholder="مثال: عمر أحمد محمد"
          className="gform-input text-right text-sm md:text-base"
        />
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
          رقم الواتساب <span className="text-destructive">*</span>
        </label>
        <input
          type="tel"
          value={customerInfo.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 11);
            onCustomerInfoChange({ ...customerInfo, phone: value });
          }}
          placeholder="01xxxxxxxxx"
          maxLength={11}
          className={`gform-input text-sm md:text-base ${customerInfo.phone.length > 0 && customerInfo.phone.length < 11 ? "border-destructive focus:border-destructive" : ""}`}
          dir="ltr"
        />
        {customerInfo.phone.length > 0 && customerInfo.phone.length < 11 && (
          <p className="text-xs md:text-sm text-destructive mt-1">
            الرقم لازم يكون 11 رقم ({customerInfo.phone.length}/11)
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
          السنة الدراسية <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onCustomerInfoChange({ ...customerInfo, year })}
              className={`py-2 px-1 rounded-lg border text-sm md:text-base font-medium transition-all ${
                customerInfo.year === year
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:border-primary/50"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
          عدد المرافقين (من خارج الكلية)
        </label>
        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => {
              const current = Number(customerInfo.companionsCount) || 0;
              if (current > 0) {
                onCustomerInfoChange({ ...customerInfo, companionsCount: current - 1 });
              }
            }}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
            disabled={(Number(customerInfo.companionsCount) || 0) === 0}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-xl font-bold">
            {Number(customerInfo.companionsCount) || 0}
          </span>
          <button
            type="button"
            onClick={() => {
              const current = Number(customerInfo.companionsCount) || 0;
              onCustomerInfoChange({ ...customerInfo, companionsCount: current + 1 });
            }}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mt-2">سعر تيكت المرافق موحد 270 جنيه</p>
      </div>

      <div className="pt-4 mt-6 border-t border-border">
        <div className="flex items-center justify-between text-lg md:text-xl font-bold text-primary">
          <span>الإجمالي المطلوب:</span>
          <span>{270 + ((Number(customerInfo.companionsCount) || 0) * 270)} جنيه</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
