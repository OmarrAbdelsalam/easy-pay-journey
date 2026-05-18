interface TshirtCustomerProps {
  orderInfo: {
    name: string;
    phone: string;
  };
  onOrderInfoChange: (info: any) => void;
}

const TshirtCustomer = ({ orderInfo, onOrderInfoChange }: TshirtCustomerProps) => {
  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-right">
            الاسم رباعي
          </label>
          <input
            type="text"
            value={orderInfo.name}
            onChange={(e) => onOrderInfoChange({ ...orderInfo, name: e.target.value })}
            placeholder="مثال: عمر أحمد محمد"
            className="w-full px-5 py-4 bg-muted/30 border-2 border-transparent rounded-2xl text-sm font-medium focus:border-foreground focus:bg-background transition-all outline-none shadow-sm hover:bg-muted/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-right">
            رقم الواتساب
          </label>
          <input
            type="tel"
            value={orderInfo.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 11);
              onOrderInfoChange({ ...orderInfo, phone: value });
            }}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            className={`w-full px-5 py-4 border-2 rounded-2xl text-sm font-medium transition-all outline-none shadow-sm text-left ${
              orderInfo.phone.length > 0 && orderInfo.phone.length < 11
                ? "border-red-400 bg-red-50/50 focus:bg-background focus:border-red-500 hover:bg-red-50"
                : "border-transparent bg-muted/30 focus:border-foreground focus:bg-background hover:bg-muted/50"
            }`}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};

export default TshirtCustomer;
