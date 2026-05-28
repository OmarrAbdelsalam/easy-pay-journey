import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface TshirtInfoProps {
  orderInfo: {
    name: string;
    phone: string;
    size: string;
    sleeveType: string;
    addonIce: boolean;
    addonName: boolean;
    customName: string;
  };
  batchType?: "Senior" | "Semi-Senior" | null;
  onOrderInfoChange: (info: any) => void;
}



const TshirtInfo = ({ orderInfo, onOrderInfoChange, batchType }: TshirtInfoProps) => {
  const sizes = batchType === "Senior" ? ["M", "L", "XL", "2XL", "3XL"] : ["M", "L", "XL"];
  
  const sleeveOptions = batchType === "Senior" 
    ? [
        { id: "half", label: "نص كم", price: 155 },
        { id: "full", label: "كم طويل", price: 165 },
      ]
    : [
        { id: "half", label: "نص كم", price: 275 },
        { id: "full", label: "كم طويل", price: 295 },
      ];

  return (
    <div className="animate-fade-in space-y-7" dir="rtl">
      
      {/* Free Gift Banner */}
      {batchType === "Senior" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-primary">قلم هدية مجاني!</span>
            <span className="text-xs text-muted-foreground">قلم مخصص عشان تكتبوا بيه الإمضاءات والذكريات</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-right">
          نوع التيشرت
        </label>
        <div className="flex flex-col gap-2.5">
          {sleeveOptions.map((option) => {
            const isSelected = orderInfo.sleeveType === option.label;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onOrderInfoChange({ ...orderInfo, sleeveType: option.label })}
                className={`relative w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-gray-50/50 dark:hover:bg-gray-900/50 bg-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-700"
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`font-bold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </span>
                </div>
                <span className={`text-xs font-bold tracking-wider ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                  {option.price} EGP
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
            المقاس (Oversized)
          </label>
          
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="text-xs font-bold text-foreground/70 underline underline-offset-4 hover:text-foreground transition-colors">
                Size Guide
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-1 bg-transparent border-none shadow-none">
              <img src={batchType === "Senior" ? "/image (73).webp" : "/image (66).webp"} alt="Size Chart" className="w-full h-auto rounded-lg" />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onOrderInfoChange({ ...orderInfo, size })}
              className={`py-3 px-2 rounded-xl border font-bold text-sm transition-all duration-200 ${
                orderInfo.size === size
                  ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "border-border/60 bg-transparent text-foreground hover:border-border hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
              }`}
              dir="ltr"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-4">
        {/* Ice Option for Senior */}
        {batchType === "Senior" && (
          <div
            onClick={() => onOrderInfoChange({ ...orderInfo, addonIce: !orderInfo.addonIce })}
            className={`w-full cursor-pointer text-right p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
              orderInfo.addonIce
                ? "border-primary bg-primary/5"
                : "border-border/60 bg-transparent hover:border-border hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <div className="pt-0.5">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                orderInfo.addonIce ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-700"
              }`}>
                {orderInfo.addonIce && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-sm ${orderInfo.addonIce ? "text-primary" : "text-foreground"}`}>
                  سبراي تلج
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+35 EGP</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                سبراي تلج للاحتفال عشان تكمل بيه فرحة اليوم.
              </p>
            </div>
          </div>
        )}

        {/* Name Under Cap Option for Semi-Senior */}
        {batchType === "Semi-Senior" && (
          <>
            <div
              onClick={() => onOrderInfoChange({ ...orderInfo, addonName: !orderInfo.addonName, customName: !orderInfo.addonName ? orderInfo.customName : "" })}
              className={`w-full cursor-pointer text-right p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                orderInfo.addonName
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-transparent hover:border-border hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
              }`}
            >
              <div className="pt-0.5">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  orderInfo.addonName ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-700"
                }`}>
                  {orderInfo.addonName && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${orderInfo.addonName ? "text-primary" : "text-foreground"}`}>
                    إضافة اسم تحت الكاب
                  </span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+25 EGP</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  يتم طباعة الاسم الذي تختاره أسفل الكاب.{" "}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button 
                        type="button" 
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-primary/90 underline underline-offset-4 hover:text-primary transition-colors"
                      >
                        شاهد مثال
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-1 bg-transparent border-none shadow-none" onClick={(e) => e.stopPropagation()}>
                      <img src="/image (67).webp" alt="شكل الاسم" className="w-full h-auto rounded-lg" />
                    </DialogContent>
                  </Dialog>
                </p>
              </div>
            </div>

            {orderInfo.addonName && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3">
                <label className="block text-xs font-bold text-foreground">الاسم المراد طباعته:</label>
                <input
                  type="text"
                  value={orderInfo.customName}
                  onChange={(e) => onOrderInfoChange({ ...orderInfo, customName: e.target.value })}
                  placeholder="اكتب الاسم هنا (عربي أو انجليزي)"
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-right"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TshirtInfo;
