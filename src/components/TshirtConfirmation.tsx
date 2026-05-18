import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

interface TshirtConfirmationProps {
  orderInfo: {
    name: string;
    phone: string;
    size: string;
  };
  paymentMethod: string | null;
  orderNumber: string | null;
}

const TshirtConfirmation = ({ orderInfo, paymentMethod, orderNumber }: TshirtConfirmationProps) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ رقم الطلب");
  };

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center space-y-6 py-8" dir="rtl">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-foreground">تم تسجيل طلبك بنجاح!</h2>
        <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
          تم استلام طلب التيشرت الخاص بك. سنقوم بمراجعة الدفع وتأكيد الطلب قريباً.
        </p>
      </div>

      <div className="w-full bg-muted/50 rounded-2xl p-5 border border-border space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <span className="text-sm font-medium text-muted-foreground">رقم الطلب</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-foreground" dir="ltr">
              {orderNumber}
            </span>
            <button
              onClick={() => orderNumber && handleCopy(orderNumber)}
              className="p-1.5 hover:bg-white rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">الاسم</span>
            <span className="font-medium">{orderInfo.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">المقاس</span>
            <span className="font-bold text-background px-2.5 py-0.5 bg-foreground rounded-md" dir="ltr">{orderInfo.size}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span className="font-medium">
              {paymentMethod === "instapay" ? "انستا باي" : "فودافون كاش"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TshirtConfirmation;
