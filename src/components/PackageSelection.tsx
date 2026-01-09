import { Check, Snowflake, Building2 } from "lucide-react";

export type PackageType = "with-ski" | "without-ski" | null;

interface PackageSelectionProps {
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
}

const packages = [
  {
    id: "without-ski" as const,
    title: "بدون سكي ايجيبت",
    icon: <Building2 className="w-6 h-6" />,
    studentPrice: 310,
    nonStudentPrice: 410,
    description: "المتحف المصري الكبير - مول مصر - شارع المعز",
  },
  {
    id: "with-ski" as const,
    title: "مع Ski Egypt",
    icon: <Snowflake className="w-6 h-6" />,
    studentPrice: 660,
    nonStudentPrice: 760,
    description: "المتحف المصري الكبير - مول مصر - Ski Egypt - شارع المعز",
    highlight: true,
    savings: "وفر 350 جنيه على تيكت سكي!",
  },
];

const PackageSelection = ({ selectedPackage, onSelect }: PackageSelectionProps) => {
  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        اختار باكدج رحلتك
      </h2>
      <p className="text-muted-foreground mb-6">
        اختر الباكدج المناسب ليك
      </p>

      <div className="grid gap-4">
        {packages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          
          return (
            <div
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className={`addon-card relative ${isSelected ? "selected" : ""} ${
                pkg.highlight ? "ring-2 ring-accent" : ""
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Snowflake className="w-3 h-3" />
                  {pkg.savings}
                </div>
              )}
              
              <div className="flex items-start gap-4 pt-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {pkg.icon}
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {pkg.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pkg.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center sm:text-right">
                      <span className="text-muted-foreground">طالب: </span>
                      <span className="font-bold text-primary">{pkg.studentPrice} جنيه</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center sm:text-right">
                      <span className="text-muted-foreground">غير طالب: </span>
                      <span className="font-bold text-primary">{pkg.nonStudentPrice} جنيه</span>
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
