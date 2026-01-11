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
  isGrad?: boolean;
}

const CustomerInfo = ({
  customerInfo,
  onCustomerInfoChange,
  isGrad = false,
}: CustomerInfoProps) => {
  const years = ["أولى", "تانية", "تالتة", "رابعة"];

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-4 md:space-y-5">
        <div>
          <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
            اسمك رباعي باللغة العربية <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, name: e.target.value })
            }
            placeholder="مثال: عمر أحمد محمد علي"
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
            className="gform-input text-sm md:text-base"
            dir="ltr"
          />
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {customerInfo.nationalId.length}/14 رقم
          </p>
        </div>

        {!isGrad && (
          <div>
            <label className="block text-sm md:text-base font-medium text-foreground mb-1.5 md:mb-2 text-right">
              السنة الدراسية <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => onCustomerInfoChange({ ...customerInfo, year })}
                  className={`py-2 md:py-3 px-3 md:px-4 rounded-lg border text-sm md:text-base font-medium transition-all ${
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
        )}
      </div>
    </div>
  );
};

export default CustomerInfo;
