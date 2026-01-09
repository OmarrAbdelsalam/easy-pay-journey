interface CustomerInfoProps {
  customerInfo: {
    name: string;
    phone: string;
    nationalId: string;
    year: string;
  };
  onCustomerInfoChange: (info: {
    name: string;
    phone: string;
    nationalId: string;
    year: string;
  }) => void;
}

const CustomerInfo = ({
  customerInfo,
  onCustomerInfoChange,
}: CustomerInfoProps) => {
  const years = ["أولى", "تانية", "تالتة", "رابعة"];

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
            اسمك رباعي باللغة العربية <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, name: e.target.value })
            }
            placeholder="مثال: عمر أحمد محمد علي"
            className="gform-input text-right text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
            رقم الواتساب <span className="text-destructive">*</span>
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, phone: e.target.value })
            }
            placeholder="01xxxxxxxxx"
            className="gform-input text-sm"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
            الرقم القومي <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={customerInfo.nationalId}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 14);
              onCustomerInfoChange({ ...customerInfo, nationalId: value });
            }}
            placeholder="أدخل الرقم القومي (14 رقم)"
            maxLength={14}
            className="gform-input text-sm"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {customerInfo.nationalId.length}/14 رقم
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
            السنة الدراسية <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => onCustomerInfoChange({ ...customerInfo, year })}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  customerInfo.year === year
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-gray-100 border-border hover:border-primary/50"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
