import { Snowflake, Landmark, ShoppingBag, Moon, Sparkles, CheckCircle2 } from "lucide-react";
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
  subtitle: "استكشف سحر القاهرة",
  icon: <Landmark className="w-7 h-7" />,
  studentPrice: 310,
  nonStudentPrice: 410,
  gradient: "from-amber-500 to-orange-600",
  bgGradient: "from-amber-50 to-orange-50",
  borderColor: "border-amber-300",
  stops: [
    { icon: <Landmark className="w-4 h-4" />, name: "المتحف المصري الكبير", highlight: true },
    { icon: <ShoppingBag className="w-4 h-4" />, name: "مول مصر" },
    { icon: <Moon className="w-4 h-4" />, name: "شارع المعز" },
  ]
}, {
  id: "with-ski" as const,
  title: "الرحلة + Ski Egypt",
  subtitle: "المغامرة الكاملة ❄️",
  icon: <Snowflake className="w-7 h-7" />,
  studentPrice: 660,
  nonStudentPrice: 760,
  gradient: "from-blue-500 to-cyan-500",
  bgGradient: "from-blue-50 to-cyan-50",
  borderColor: "border-blue-300",
  stops: [
    { icon: <Landmark className="w-4 h-4" />, name: "المتحف المصري الكبير" },
    { icon: <ShoppingBag className="w-4 h-4" />, name: "مول مصر" },
    { icon: <Snowflake className="w-4 h-4" />, name: "Ski Egypt", highlight: true },
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
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <label className="text-lg font-bold text-foreground">
          اختار باكدج رحلتك <span className="text-destructive">*</span>
        </label>
      </div>

      <div className="space-y-5">
        {packages.map(pkg => {
        const isSelected = selectedPackage === pkg.id;
        return <div 
          key={pkg.id} 
          onClick={() => onSelect(pkg.id)} 
          className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${
            isSelected 
              ? `bg-gradient-to-br ${pkg.bgGradient} border-2 ${pkg.borderColor} shadow-xl` 
              : "bg-card border-2 border-border hover:border-primary/30 shadow-md hover:shadow-lg"
          }`}
        >
              {/* Highlight Badge */}
              {pkg.highlight && (
                <div className="absolute top-0 left-0 z-10">
                  <div className={`bg-gradient-to-r ${pkg.gradient} text-white text-sm font-bold px-4 py-2 rounded-br-2xl shadow-lg flex items-center gap-1`}>
                    <Sparkles className="w-4 h-4" />
                    {pkg.savings}
                  </div>
                </div>
              )}
              
              {/* Header Section */}
              <div className={`p-5 ${pkg.highlight ? 'pt-12' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Selection Indicator */}
                  <div className={`w-7 h-7 rounded-full border-3 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isSelected 
                      ? `bg-gradient-to-br ${pkg.gradient} border-transparent shadow-lg` 
                      : "border-muted-foreground/40 bg-background"
                  }`}>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    {/* Title with Icon */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${pkg.gradient} text-white shadow-lg`}>
                        {pkg.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground">
                          {pkg.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
                      </div>
                    </div>
                    
                    {/* Trip Stops */}
                    <div className="bg-white/80 dark:bg-background/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-3 font-semibold flex items-center gap-1">
                        <Moon className="w-3 h-3" />
                        محطات الرحلة:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pkg.stops.map((stop, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                              stop.highlight 
                                ? `bg-gradient-to-r ${pkg.gradient} text-white shadow-md` 
                                : "bg-muted/80 text-foreground hover:bg-muted"
                            }`}
                          >
                            <span className={stop.highlight ? "text-white/90" : "text-primary"}>{stop.icon}</span>
                            <span>{stop.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Ski Egypt Images */}
                    {pkg.images && (
                      <div className="flex gap-3 mb-4">
                        {pkg.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={img} 
                              alt={`Ski Egypt ${index + 1}`} 
                              className="w-28 h-28 rounded-xl object-cover shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl border-2 border-white" 
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Price Section */}
                    <div className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${pkg.gradient} text-white`}>
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm">سعر الطالب:</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-3xl">{pkg.studentPrice}</span>
                        <span className="text-lg">ج.م</span>
                      </div>
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