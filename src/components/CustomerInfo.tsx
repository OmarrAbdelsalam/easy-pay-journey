interface CustomerInfoProps {
  customerInfo: {
    name: string;
    phone: string;
    nationalId: string;
  };
  onCustomerInfoChange: (info: {
    name: string;
    phone: string;
    nationalId: string;
  }) => void;
}

const CustomerInfo = ({
  customerInfo,
  onCustomerInfoChange,
}: CustomerInfoProps) => {
  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        بياناتك الشخصية
      </h2>
      <p className="text-muted-foreground mb-6">
        أدخل بياناتك للتواصل
      </p>

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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 14);
              onCustomerInfoChange({ ...customerInfo, nationalId: value });
            }}
            placeholder="أدخل الرقم القومي (14 رقم)"
            maxLength={14}
            className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {customerInfo.nationalId.length}/14 رقم
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
