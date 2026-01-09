import { CheckCircle, Calendar, MapPin, Phone } from "lucide-react";
import { PaymentMethod } from "./PaymentSelection";
import { PackageType } from "./PackageSelection";

interface OrderConfirmationProps {
  orderDetails: {
    participantType: "student" | "non-student";
    selectedPackage: PackageType;
    customerInfo: {
      name: string;
      phone: string;
      nationalId: string;
      year: string;
    };
    paymentMethod: PaymentMethod;
    transactionRef: string;
  };
}

const OrderConfirmation = ({ orderDetails }: OrderConfirmationProps) => {
  const isStudent = orderDetails.participantType === "student";
  const basePrice = isStudent ? 310 : 410;
  const skiPrice = 350;
  const total = orderDetails.selectedPackage === "with-ski" ? basePrice + skiPrice : basePrice;

  const paymentMethodNames = {
    instapay: "InstaPay",
    vodafone: "Vodafone Cash",
    orange: "Orange Cash",
  };

  const yearLabels: Record<string, string> = {
    first: "أولى",
    second: "تانية",
    third: "تالتة",
    fourth: "رابعة",
  };

  const orderNumber = `CAI-${Date.now().toString().slice(-8)}`;

  return (
    <div className="animate-fade-in text-center" dir="rtl">
      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-success" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        تم تأكيد الحجز!
      </h2>
      <p className="text-muted-foreground mb-8">
        شكراً ليك يا {orderDetails.customerInfo.name.split(" ")[0]}، هنتواصل معاك قريب على الواتساب
      </p>

      <div className="bg-muted/50 rounded-xl p-6 text-right max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <span className="text-muted-foreground">رقم الطلب</span>
          <span className="font-mono font-bold text-primary">{orderNumber}</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الاسم</span>
            <span className="font-medium">{orderDetails.customerInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الواتساب</span>
            <span className="font-medium" dir="ltr">
              {orderDetails.customerInfo.phone}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">نوع الاشتراك</span>
            <span className="font-medium">
              {orderDetails.participantType === "student" ? "طالب" : "غير طالب"}
            </span>
          </div>
          {isStudent && orderDetails.customerInfo.year && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الفرقة</span>
              <span className="font-medium">
                {yearLabels[orderDetails.customerInfo.year]}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">الباكدج</span>
            <span className="font-medium">
              {orderDetails.selectedPackage === "with-ski" ? "مع Ski Egypt" : "بدون Ski Egypt"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span className="font-medium">
              {orderDetails.paymentMethod && paymentMethodNames[orderDetails.paymentMethod]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم المعاملة</span>
            <span className="font-mono font-medium" dir="ltr">
              {orderDetails.transactionRef}
            </span>
          </div>

          <div className="border-t border-border pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold">الإجمالي</span>
              <span className="font-bold text-lg text-primary">{total} جنيه</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">التاريخ</p>
            <p className="font-medium text-sm">قريباً</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">الوجهة</p>
            <p className="font-medium text-sm">القاهرة</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
          <Phone className="w-5 h-5 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">للاستفسار</p>
            <p className="font-medium text-sm" dir="ltr">01012345678</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
