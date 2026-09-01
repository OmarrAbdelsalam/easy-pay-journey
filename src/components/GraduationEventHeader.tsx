import { useState } from "react";
import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Camera, 
  Palette, 
  Clock, 
  Printer, 
  Mic, 
  Gift, 
  Award, 
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export const GraduationEventHeader = () => {
  const [showFullDetails, setShowFullDetails] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("package");

  return (
    <div className="w-full space-y-6 animate-fade-in" dir="rtl">
      {/* Main Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white p-6 sm:p-8 shadow-2xl border border-amber-500/30">
        {/* Decorative Background Elements */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            حجز رسمي 2025 - 2026
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-md border border-white/20">
            أسبقية الحجز
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 backdrop-blur-md border border-amber-400/30">
            العدد محدود جداً
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3 leading-snug">
          🎓 حفل تخرج كلية الحاسبات والمعلومات
          <span className="block text-amber-300 text-xl sm:text-2xl font-bold mt-1">
            جامعة طنطا – دفعة 2025 / 2026 ♥️
          </span>
        </h1>

        {/* Event Meta Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5 text-sm">
          <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-amber-200 text-xs font-semibold">موعد الحفل</p>
              <p className="font-bold text-white text-sm sm:text-base">أحد أيام (22 – 23 – 24) سبتمبر</p>
              <p className="text-[11px] text-amber-200/80">(سيتم تحديد اليوم النهائي قريبًا)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-amber-200 text-xs font-semibold">موقع الحفل</p>
              <p className="font-bold text-white text-xs sm:text-sm">قاعة المؤتمرات – المجمع الطبي</p>
              <p className="text-[11px] text-amber-200/80">بجوار كلية العلوم – جامعة طنطا</p>
            </div>
          </div>
        </div>

        {/* Pricing Highlights Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right">
            <span className="text-xs text-amber-200 block font-medium">سعر تذكرة الخريج (شاملة الباكدج بالكامل + 2 مرافق مجاناً)</span>
            <span className="text-3xl font-black text-amber-300 tracking-tight">1100 <span className="text-base font-bold text-white">جنيه</span></span>
          </div>

          <div className="h-8 w-px bg-white/20 hidden sm:block" />

          <div className="text-center sm:text-right">
            <span className="text-xs text-amber-200 block font-medium">المرافق الإضافي</span>
            <span className="text-xl font-bold text-white">220 <span className="text-xs font-normal text-amber-200">ج / للمرافق</span></span>
          </div>

          <button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-lg"
          >
            {showFullDetails ? "إخفاء التفاصيل" : "عرض تفاصيل الحفل"}
            {showFullDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Full Event Features Details */}
      {showFullDetails && (
        <div className="bg-card rounded-3xl p-5 sm:p-6 shadow-xl border border-primary/20 space-y-6 animate-slide-up">
          {/* Tabs header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-black text-primary flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              تفاصيل مميزات حفل التخرج
            </h2>
            <span className="text-xs text-muted-foreground font-medium">دفعة 2025/2026</span>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Package & Trophy */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Gift className="w-5 h-5" />
                </div>
                <span>1️⃣ باكدج الخريج والتكريم</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>درع نحاسي فاخر داخل علبة قطيفة 📦 (ومتاح كريستال أو أكريليك بتكلفة إضافية)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>شهادة تكريم كوشيه 350 جرام 🎗</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>روب + كاب التخرج</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>وشاح ستان مطبوع بديزاين وألوان مختلفة هنختارها سوا</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>شنطة خاصة "سينيور 2025" 🎓</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تاتو مؤقت (بيقعد يومين زي الحنة ويتمسح لوحده - حلال) 🎨</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>دوناتس تخرج مميزة من Dippin 🍩 + هدية خاصة ✨</span>
                </li>
              </ul>
            </div>

            {/* 2. Media */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Camera className="w-5 h-5" />
                </div>
                <span>2️⃣ الميديا والتصوير (7 كاميرات)</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تيم تصوير احترافي (5 فوتوغرافرز + 2 فيديوجرافرز = 7 كاميرات Full-Frame)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تغطية شاملة: الفوتو آريا + داخل القاعة (قبل وأثناء وبعد التكريم)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>برومو احترافي 🎥 + فيديوهات توثيقية للحفل</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تصوير ريلز (Reels) فردية وجماعية 📱</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mobile Photography للحظات العفوية ✨</span>
                </li>
              </ul>
            </div>

            {/* 3. Decoration */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <span>3️⃣ الديكوريشن ومواقع التصوير (+7 مناطق)</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تيم متخصص في الديكور وتنظيم اللوكيشنز</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>أكثر من 7 مناطق تصوير (Entrance - نيون - Backdrops - فلاش بانل - مجسمات 2D & 3D - بالونات - ورود - خشب)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ريد كاربت (Red Carpet) فخم للتصوير الفردي والجماعي 👩‍🎓👨‍🎓</span>
                </li>
              </ul>
            </div>

            {/* 4. Organization & Flow */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <span>4️⃣ تنظيم وإدارة اليوم بالكامل</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>استقبال وتنظيم دخول المرافقين</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ترتيب أماكن الجلوس داخل القاعة</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>توزيع باكدج التخرج لكل خريج + تنظيم طابور العرض ✨</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>إمكانية تسليم شنط التخرج قبل الحفل (في حالة الحجز المبكر)</span>
                </li>
              </ul>
            </div>

            {/* 5. Designs & Prints */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Printer className="w-5 h-5" />
                </div>
                <span>5️⃣ التصميمات والمطبوعات</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تصميم هوية بصرية كاملة + لوجو خاص بالدفعة</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>حملة دعائية مميزة على السوشيال ميديا</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>2 بانر كبير (منهم بانر صور للدفعة) + 2 رول آب باللوجو وتايتل الدفعة</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>دعوات VIP وتذاكر حضور فخمة</span>
                </li>
              </ul>
            </div>

            {/* 6. Host & Honors */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/10 hover:border-primary/30 transition-all space-y-2.5">
              <div className="flex items-center gap-2.5 text-primary font-bold text-base">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Mic className="w-5 h-5" />
                </div>
                <span>6️⃣ مقدم الحفل وتكريم الأساتذة</span>
              </div>
              <ul className="text-xs sm:text-sm text-foreground/90 space-y-1.5 pr-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>مذيع محترف متخصص في تقديم الحفلات والمؤتمرات (عربي وإنجليزي)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>سكريبت مكتوب مخصوص لدفعة حاسبات طنطا 📋</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>دروع تكريم خاصة لأساتذة الكلية 🎖️</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraduationEventHeader;
