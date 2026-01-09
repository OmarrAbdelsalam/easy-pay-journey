import { addons } from "./AddonsSelection";

interface CartSummaryProps {
  participantType: "student" | "non-student" | null;
  selectedAddons: string[];
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  onCustomerInfoChange: (info: { name: string; phone: string; email: string }) => void;
}

const CartSummary = ({
  participantType,
  selectedAddons,
  customerInfo,
  onCustomerInfoChange,
}: CartSummaryProps) => {
  const basePrice = participantType === "student" ? 250 : 350;
  const addonsTotal = selectedAddons.reduce((total, addonId) => {
    const addon = addons.find((a) => a.id === addonId);
    return total + (addon?.price || 0);
  }, 0);
  const total = basePrice + addonsTotal;

  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        ملخص الطلب
      </h2>
      <p className="text-muted-foreground mb-6">
        راجع طلبك وأدخل بياناتك
      </p>

      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-4">تفاصيل الطلب</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {participantType === "student" ? "طالب" : "غير طالب"}
              </span>
              <span className="font-medium">{basePrice} جنيه</span>
            </div>

            {selectedAddons.length > 0 && (
              <>
                <div className="border-t border-border my-2" />
                <p className="text-sm text-muted-foreground">الإضافات:</p>
                {selectedAddons.map((addonId) => {
                  const addon = addons.find((a) => a.id === addonId);
                  if (!addon) return null;
                  return (
                    <div
                      key={addonId}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">{addon.name}</span>
                      <span className="font-medium">+{addon.price} جنيه</span>
                    </div>
                  );
                })}
              </>
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
          <h3 className="font-semibold text-foreground">بياناتك</h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الاسم بالكامل
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, name: e.target.value })
              }
              placeholder="أدخل اسمك الكامل"
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              رقم الموبايل
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
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, email: e.target.value })
              }
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
