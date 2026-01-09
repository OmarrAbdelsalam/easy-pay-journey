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
      <div className="space-y-6">
        <div>
          <label className="gform-label">
            اسمك رباعي باللغة العربية <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, name: e.target.value })
            }
            placeholder="مثال: عمر أحمد محمد علي"
            className="gform-input text-right"
          />
        </div>

        <div>
          <label className="gform-label">
            رقم الواتساب <span className="text-destructive">*</span>
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              onCustomerInfoChange({ ...customerInfo, phone: e.target.value })
            }
            placeholder="01xxxxxxxxx"
            className="gform-input"
            dir="ltr"
          />
        </div>

        <div>
          <label className="gform-label">
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
            className="gform-input"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {customerInfo.nationalId.length}/14 رقم
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
