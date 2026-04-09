import { CircleCheckBig, MapPin } from "lucide-react";
import { PaymentMethod } from "./PaymentUpload";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface TournamentConfirmationProps {
  teamInfo: {
    teamName: string;
    captainName: string;
    captainPhone: string;
    year: string;
    players: string[];
  };
  paymentMethod: PaymentMethod;
  orderNumber?: string | null;
}

const paymentMethodNames: Record<string, string> = {
  instapay: "InstaPay",
  vodafone: "Vodafone Cash",
  orange: "Orange Cash",
};

const TournamentConfirmation = ({ teamInfo, paymentMethod, orderNumber }: TournamentConfirmationProps) => {
  const order = orderNumber || `DWR-${Date.now().toString().slice(-8)}`;

  return (
    <div className="animate-fade-in text-center" dir="rtl">
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CircleCheckBig className="w-14 h-14 text-white" strokeWidth={2.5} />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">تم تسجيل فريقك!</h2>
      <p className="text-muted-foreground mb-8">
        شكراً يا {teamInfo.captainName.split(" ")[0]}، هنراجع التحويل ونتواصل معاك على الواتساب
      </p>

      <div className="bg-muted/50 rounded-xl p-6 text-right max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <span className="text-muted-foreground">رقم الطلب</span>
          <span className="font-mono font-bold text-primary">{order}</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">اسم الفريق</span>
            <span className="font-bold">{teamInfo.teamName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الكابتن</span>
            <span className="font-medium">{teamInfo.captainName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الواتساب</span>
            <span className="font-medium" dir="ltr">{teamInfo.captainPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">السنة</span>
            <span className="font-medium">{teamInfo.year}</span>
          </div>

          <div className="border-t border-border pt-3 mt-3">
            <p className="text-muted-foreground mb-2">اللاعبين ({teamInfo.players.length})</p>
            <div className="space-y-1">
              {teamInfo.players.map((player, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-4">{i + 1}.</span>
                  <span>{player}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع</span>
            <span className="font-medium">{paymentMethod && paymentMethodNames[paymentMethod]}</span>
          </div>

          <div className="border-t border-border pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-base">الإجمالي</span>
              <span className="font-bold text-2xl text-primary">600 جنيه</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border shadow-sm">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">المكان</p>
            <p className="font-bold text-xs">كلية الحاسبات والمعلومات — جامعة طنطا</p>
          </div>
        </div>
        <a
          href="https://wa.me/201205992002"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border hover:bg-muted/30 transition-all shadow-sm group"
        >
          <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6 transition-transform group-hover:scale-110" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">للاستفسار</p>
            <p className="font-bold text-sm" dir="ltr">01205992002</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default TournamentConfirmation;
