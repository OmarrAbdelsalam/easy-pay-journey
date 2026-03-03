import { Check, Utensils, Gamepad2, Camera } from "lucide-react";
export type PackageType = "iftar" | null;

interface PackageSelectionProps {
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
  isGrad?: boolean;
}

const packages = [{
  id: "iftar" as const,
  title: "افطار رمضان",
  icon: <Utensils className="w-5 h-5" />,
  studentPrice: 270,
  nonStudentPrice: 270,
  description: "الوجبة الموحدة والأنشطة المختلفة",
  highlight: true,
  savings: "الكل بـ 270ج",
}];

const mealsList = [
  "رز بسمتي",
  "ربع فرخه",
  "٢ كفته",
  "٢ سمبوسه",
  "٤ محشي ورق عنب",
  "علبة حلويات ٥ قطع",
  "بيج كولا",
  "مايه"
];

const activitiesList = [
  "بورد جيمز (سكرو وغيرها)",
  "كورنرز للتصوير",
  "بلايستيشن و e-sports",
  "شخصيات وتنوره",
  "مسابقات كتير بقا"
];

const PackageSelection = ({
  selectedPackage,
  onSelect,
  isGrad = false
}: PackageSelectionProps) => {
  return (
    <div className="animate-fade-in" dir="rtl">
      <label className="gform-label md:text-base">
        تفاصيل التيكت <span className="text-destructive">*</span>
      </label>

      <div className="space-y-4 md:space-y-5 mt-4">
        {packages.map(pkg => {
          const isSelected = selectedPackage === pkg.id;
          return (
            <div 
              key={pkg.id} 
              onClick={() => onSelect(pkg.id)} 
              className={`relative p-4 md:p-5 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"}`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {isSelected && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground md:text-xl">
                      {pkg.title}
                    </h3>
                  </div>
                  
                  <div className="text-sm md:text-base font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-normal">سعر التيكت: </span>
                    <span>270 جنيه</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 text-foreground mb-2">
                        <Utensils className="w-4 h-4 text-primary" />
                        محتوى الوجبة الموحدة
                      </h4>
                      <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {mealsList.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold flex items-center gap-2 text-foreground mb-2">
                        <Gamepad2 className="w-4 h-4 text-primary" />
                        الأنشطة المتاحة
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {activitiesList.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { packages };
export default PackageSelection;