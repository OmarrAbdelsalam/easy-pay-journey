// بيانات الإيفنت الحالي -- أي تعديل في السعر أو التاريخ أو المكان بيتعمل هنا بس
export const EVENT = {
  title: "Last First Day",
  tagline: "Seniors 2027",
  subtitle: "كلية الحاسبات والمعلومات - جامعة طنطا",
  price: 40,
  // مؤقت -- هيتغير بعدين
  dateLabel: "السبت 10 أكتوبر 2026",
  includes: [
    "ستيك بصورتك وانت صغير",
    "بانرات التصوير",
    "ميديا كافريدج لليوم كله",
    "بوست ليك على انستجرام بصورتك وانت صغير",
    "صورة جماعية للدفعة",
    "ألبوم صور اليوم كامل على Drive",
  ],
  batch: 2027,
  selectedPackage: "last_first_day_2027",
  orderPrefix: "LFD",
} as const;

// الحجوزات القديمة (حفلة التخرج) محفوظة على batch 2026
export const GRADUATION_BATCH = 2026;
