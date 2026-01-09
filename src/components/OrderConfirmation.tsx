import { CircleCheckBig, Calendar, MapPin, Ticket } from "lucide-react";
import { PaymentMethod } from "./PaymentUpload";
import { PackageType, packages } from "./PackageSelection";
import { Companion } from "./TicketQuantity";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface OrderConfirmationProps {
  orderDetails: {
    selectedPackage: PackageType;
    companions: Companion[];
    customerInfo: {
      name: string;
      phone: string;
      nationalId: string;
    };
    paymentMethod: PaymentMethod;
    orderNumber?: string | null;
  };
}

const OrderConfirmation = ({ orderDetails }: OrderConfirmationProps) => {
  const pkg = packages.find((p) => p.id === orderDetails.selectedPackage);
  const studentTotal = pkg?.studentPrice || 0;
  const companionsTotal = orderDetails.companions.reduce((total, comp) => {
    const compPkg = packages.find((p) => p.id === comp.packageType);
    return total + (compPkg?.nonStudentPrice || 0);
  }, 0);
  const total = studentTotal + companionsTotal;

  const paymentMethodNames = {
    instapay: "InstaPay",
    vodafone: "Vodafone Cash",
    orange: "Orange Cash",
  };

  const orderNumber = orderDetails.orderNumber || `CAI-${Date.now().toString().slice(-8)}`;

  return (
    <div className="animate-fade-in text-center" dir="rtl">
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CircleCheckBig className="w-14 h-14 text-white" strokeWidth={2.5} />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        تم استلام طلبك!
      </h2>
      <p className="text-muted-foreground mb-8">
        شكراً ليك يا {orderDetails.customerInfo.name.split(" ")[0]}، هنراجع التحويل ونتواصل معاك على الواتساب
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
            <span className="text-muted-foreground">تذكرتك (طالب)</span>
            <div className="text-left">
              <p className="font-medium">
                {orderDetails.selectedPackage === "with-ski" ? "رحلة القاهرة + Ski Egypt" : "رحلة القاهرة"}
              </p>
              <p className="text-foreground font-bold">{studentTotal} جنيه</p>
            </div>
          </div>
          
          {orderDetails.companions.length > 0 && (
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Ticket className="w-4 h-4" />
                  المرافقين ({orderDetails.companions.length})
                </span>
                <span className="font-medium">{companionsTotal} جنيه</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span className="font-medium">
              {orderDetails.paymentMethod && paymentMethodNames[orderDetails.paymentMethod]}
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
            <p className="font-medium text-sm">12 فبراير</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">الوجهة</p>
            <p className="font-medium text-xs">المتحف المصري الكبير - مول مصر - سكي ايجيبت - شارع المعز</p>
          </div>
        </div>
        <a 
          href="https://wa.me/201012345678" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border hover:bg-muted/30 transition-colors"
        >
          <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">للاستفسار</p>
            <p className="font-medium text-sm" dir="ltr">01012345678</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default OrderConfirmation;
