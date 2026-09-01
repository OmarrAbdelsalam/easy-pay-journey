import React from "react";
import { CheckCircle, Download, Share2, Sparkles, Calendar, MapPin, Award, User, Phone, Users } from "lucide-react";
import logo from "/logo.webp";

interface GraduationConfirmationProps {
  orderInfo: {
    name: string;
    phone: string;
    ticketName: string;
    gownSize: string;
    companionsCount: number | string;
  };
  paymentMethod: string | null;
  orderNumber: string | null;
  totalPrice: number;
}

export const GraduationConfirmation: React.FC<GraduationConfirmationProps> = ({
  orderInfo,
  paymentMethod,
  orderNumber,
  totalPrice,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in space-y-6 text-center" dir="rtl">
      {/* Success Badge */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">
          تم استلام طلب حجز حفل التخرج بنجاح! ♥️
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          مبروك يا خريج! تم تسجيل بياناتك وتأكيد عملية التحويل بنجاح. احتفظ بتذكرة الحجز الإلكترونية.
        </p>
      </div>

      {/* Luxury Printable Ticket Card */}
      <div 
        id="graduation-ticket"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border-2 border-amber-400/40 text-right space-y-6 print:shadow-none print:m-0"
      >
        {/* Ticket Header & Watermark Background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-amber-400/30 pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FCI Logo" className="h-10 w-auto bg-white/90 p-1 rounded-xl shadow-md" />
            <div>
              <h3 className="font-black text-amber-300 text-base sm:text-lg tracking-tight">
                كلية الحاسبات والمعلومات – جامعة طنطا
              </h3>
              <p className="text-xs text-slate-200">تذكرة حجز حفل التخرج (دفعة 2025/2026)</p>
            </div>
          </div>
          <div className="bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
            Senior Ticket
          </div>
        </div>

        {/* Order Serial Badge */}
        <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs text-amber-200 block font-medium">رقم التأكيد المرجعي (Order #)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-wider">
              {orderNumber || "FCI-2025-XXXX"}
            </span>
          </div>

          {/* Simple Clean QR Code Representation */}
          <div className="bg-white p-2 rounded-xl shadow-md flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H9V9H3V3Z" fill="#7A0C2E" />
              <path d="M15 3H21V9H15V3Z" fill="#7A0C2E" />
              <path d="M3 15H9V21H3V15Z" fill="#7A0C2E" />
              <path d="M5 5H7V7H5V5Z" fill="#FFFFFF" />
              <path d="M17 5H19V7H17V5Z" fill="#FFFFFF" />
              <path d="M5 17H7V19H5V17Z" fill="#FFFFFF" />
              <path d="M11 3H13V7H11V3Z" fill="#7A0C2E" />
              <path d="M15 11H21V13H15V11Z" fill="#7A0C2E" />
              <path d="M11 15H13V21H11V15Z" fill="#7A0C2E" />
              <path d="M15 15H17V17H15V15Z" fill="#7A0C2E" />
              <path d="M19 19H21V21H19V19Z" fill="#7A0C2E" />
            </svg>
          </div>
        </div>

        {/* Ticket Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl space-y-1">
            <span className="text-amber-200 block font-semibold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" /> الاسم بالشهادة:
            </span>
            <span className="font-extrabold text-white text-sm block truncate">{orderInfo.name}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl space-y-1">
            <span className="text-amber-200 block font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> اسم المناداة على التيكيت:
            </span>
            <span className="font-extrabold text-amber-300 text-sm block truncate">{orderInfo.ticketName || orderInfo.name}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl space-y-1">
            <span className="text-amber-200 block font-semibold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-400" /> رقم الواتس:
            </span>
            <span className="font-bold text-white font-mono text-sm block" dir="ltr">{orderInfo.phone}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl space-y-1">
            <span className="text-amber-200 block font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" /> عدد المرافقين:
            </span>
            <span className="font-bold text-white text-sm block">
              {orderInfo.companionsCount === "more" ? "أكثر من 6 مرافقين" : `${orderInfo.companionsCount} مرافق`}
            </span>
          </div>
        </div>

        {/* Event Date & Location Summary */}
        <div className="border-t border-white/20 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>الموعد: أحد أيام (22 – 23 – 24) سبتمبر</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>المكان: قاعة المؤتمرات – المجمع الطبي</span>
          </div>
        </div>

        {/* Paid Stamp */}
        <div className="flex items-center justify-between bg-amber-400 text-slate-950 p-3.5 rounded-xl font-bold">
          <span>المبلغ المسدد: {totalPrice} جنيه</span>
          <span className="text-xs bg-slate-950 text-amber-300 px-2.5 py-1 rounded-md">
            طريقة الدفع: {paymentMethod === "instapay" ? "InstaPay" : "فودافون كاش"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <Download className="w-4 h-4" />
          طباعة / حفظ التذكرة PDF
        </button>
      </div>
    </div>
  );
};

export default GraduationConfirmation;
