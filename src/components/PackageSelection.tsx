import { Check, Snowflake } from "lucide-react";

export type PackageType = "with-ski" | "without-ski" | null;

interface PackageSelectionProps {
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
  participantType: "student" | "non-student" | null;
}

const PackageSelection = ({ selectedPackage, onSelect, participantType }: PackageSelectionProps) => {
  const isStudent = participantType === "student";
  
  const packages = [
    {
      id: "with-ski" as const,
      title: "باكدج مع Ski Egypt",
      description: "المتحف المصري الكبير - مول مصر - Ski Egypt - شارع المعز",
      studentPrice: 660,
      nonStudentPrice: 760,
      highlight: true,
      savings: "وفر 350 جنيه!",
    },
    {
      id: "without-ski" as const,
      title: "باكدج بدون Ski Egypt",
      description: "المتحف المصري الكبير - مول مصر - شارع المعز",
      studentPrice: 310,
      nonStudentPrice: 410,
      highlight: false,
    },
  ];

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
          const price = isStudent ? pkg.studentPrice : pkg.nonStudentPrice;
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      {pkg.title}
                    </h3>
                    <div className="text-lg font-bold text-primary">
                      {price} جنيه
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pkg.description}
                  </p>
                  {pkg.highlight && (
                    <p className="text-xs text-accent mt-2 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" />
                      جولة في القطب الجنوبي بـ 350 جنيه بدلاً من 700 جنيه
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PackageSelection;
