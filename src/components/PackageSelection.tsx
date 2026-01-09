import { Check, Snowflake, Building2 } from "lucide-react";
import skiEgypt1 from "@/assets/ski-egypt-1.png";
import skiEgypt2 from "@/assets/ski-egypt-2.png";
export type PackageType = "with-ski" | "without-ski" | null;
interface PackageSelectionProps {
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
}
const packages = [{
  id: "without-ski" as const,
  title: "بدون سكي ايجيبت",
  icon: <Building2 className="w-5 h-5" />,
  studentPrice: 310,
  nonStudentPrice: 410,
  description: "المتحف المصري الكبير - مول مصر - شارع المعز"
}, {
  id: "with-ski" as const,
  title: "مع Ski Egypt",
  icon: <Snowflake className="w-5 h-5" />,
  studentPrice: 660,
  nonStudentPrice: 760,
  description: "المتحف المصري الكبير - مول مصر - Ski Egypt - شارع المعز",
  highlight: true,
  savings: "وفر 350ج!",
  images: [skiEgypt1, skiEgypt2]
}];
const PackageSelection = ({
  selectedPackage,
  onSelect
}: PackageSelectionProps) => {
  return <div className="animate-fade-in" dir="rtl">
      <label className="gform-label">
        اختار باكدج رحلتك <span className="text-destructive">*</span>
      </label>

      <div className="space-y-3 mt-4">
        {packages.map(pkg => {
        const isSelected = selectedPackage === pkg.id;
        return <div key={pkg.id} onClick={() => onSelect(pkg.id)} className={`relative p-4 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"}`}>
              {pkg.highlight && <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                  {pkg.savings}
                </span>}
              
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={isSelected ? "text-primary" : "text-muted-foreground"}>
                      {pkg.icon}
                    </span>
                    <h3 className="font-semibold text-foreground">
                      {pkg.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {pkg.description}
                  </p>
                  
                  {/* Ski Egypt Images */}
                  {pkg.images && <div className="flex gap-2 mb-3">
                      {pkg.images.map((img, index) => <img key={index} src={img} alt={`Ski Egypt ${index + 1}`} className="w-20 h-20 rounded-lg object-cover" />)}
                    </div>}
                  
                  <div className="text-sm">
                    <span className="font-bold text-foreground">{pkg.studentPrice}ج</span>
                  </div>
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
};
export { packages };
export default PackageSelection;