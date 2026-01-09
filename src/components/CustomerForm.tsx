import { PackageType } from "./PackageSelection";

interface CustomerFormProps {
  participantType: "student" | "non-student" | null;
  selectedPackage: PackageType;
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

const CustomerForm = ({
  participantType,
  selectedPackage,
  customerInfo,
  onCustomerInfoChange,
}: CustomerFormProps) => {
  const isStudent = participantType === "student";
  const basePrice = isStudent ? 310 : 410;
  const skiPrice = 350;
  const total = selectedPackage === "with-ski" ? basePrice + skiPrice : basePrice;

  const years = [
    { id: "first", label: "أولى" },
    { id: "second", label: "تانية" },
    { id: "third", label: "تالتة" },
    { id: "fourth", label: "رابعة" },
  ];

  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        بياناتك
      </h2>
      <p className="text-muted-foreground mb-6">
        أدخل بياناتك الشخصية
      </p>

      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">ملخص الطلب</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {participantType === "student" ? "طالب" : "غير طالب"}
              </span>
              <span className="font-medium">{basePrice} جنيه</span>
            </div>

            {selectedPackage === "with-ski" && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ski Egypt</span>
                <span className="font-medium">+{skiPrice} جنيه</span>
              </div>
            )}

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">الإجمالي</span>
                <span className="font-bold text-xl text-primary">
                  {total} جنيه
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              اسمك رباعي باللغة العربية <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, name: e.target.value })
              }
              placeholder="مثال: عمر أحمد محمد علي"
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              رقم الواتساب <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, phone: e.target.value })
              }
              placeholder="01xxxxxxxxx"
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الرقم القومي <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.nationalId}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, nationalId: e.target.value })
              }
              placeholder="أدخل الرقم القومي (14 رقم)"
              maxLength={14}
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              dir="ltr"
            />
          </div>

          {isStudent && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                فرقة كام <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {years.map((year) => (
                  <button
                    key={year.id}
                    type="button"
                    onClick={() =>
                      onCustomerInfoChange({ ...customerInfo, year: year.id })
                    }
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      customerInfo.year === year.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {year.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
