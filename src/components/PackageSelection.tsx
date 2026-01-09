import { Snowflake, MapPin, Building2, Landmark, ShoppingBag, Moon } from "lucide-react";
import skiEgypt1 from "@/assets/ski-egypt-1.png";
import skiEgypt2 from "@/assets/ski-egypt-2.png";
export type PackageType = "with-ski" | "without-ski" | null;
interface PackageSelectionProps {
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
}

const packages = [{
  id: "without-ski" as const,
  title: "الرحلة الأساسية",
  subtitle: "جولة القاهرة الكاملة",
  icon: <Landmark className="w-6 h-6" />,
  studentPrice: 310,
  nonStudentPrice: 410,
  stops: [
    { icon: <Landmark className="w-4 h-4" />, name: "المتحف المصري الكبير" },
    { icon: <ShoppingBag className="w-4 h-4" />, name: "مول مصر" },
    { icon: <Moon className="w-4 h-4" />, name: "شارع المعز" },
  ]
}, {
  id: "with-ski" as const,
  title: "الرحلة + Ski Egypt",
  subtitle: "المغامرة الكاملة",
  icon: <Snowflake className="w-6 h-6" />,
  studentPrice: 660,
  nonStudentPrice: 760,
  stops: [
    { icon: <Landmark className="w-4 h-4" />, name: "المتحف المصري الكبير" },
    { icon: <ShoppingBag className="w-4 h-4" />, name: "مول مصر" },
    { icon: <Snowflake className="w-4 h-4" />, name: "Ski Egypt" },
    { icon: <Moon className="w-4 h-4" />, name: "شارع المعز" },
  ],
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

      <div className="space-y-4 mt-4">
        {packages.map(pkg => {
        const isSelected = selectedPackage === pkg.id;
        return <div key={pkg.id} onClick={() => onSelect(pkg.id)} className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isSelected ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10" : "border-border hover:border-primary/40 bg-card hover:shadow-md"}`}>
              {pkg.highlight && <span className="absolute -top-3 left-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {pkg.savings}
                </span>}
              
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/50"}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {pkg.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {pkg.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
                    </div>
                  </div>
                  
                  {/* Trip Stops */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">محطات الرحلة:</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-1.5 bg-background rounded-full px-3 py-1.5 text-sm">
                          <span className="text-primary">{stop.icon}</span>
                          <span className="text-foreground">{stop.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Ski Egypt Images */}
                  {pkg.images && <div className="flex gap-3 mb-3">
                      {pkg.images.map((img, index) => <img key={index} src={img} alt={`Ski Egypt ${index + 1}`} className="w-24 h-24 rounded-xl object-cover shadow-md hover:scale-105 transition-transform" />)}
                    </div>}
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">طالب:</span>
                      <span className="font-bold text-xl text-primary">{pkg.studentPrice}ج</span>
                    </div>
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