import { Minus, Plus, Snowflake, Building2 } from "lucide-react";
import { PackageType, packages } from "./PackageSelection";

interface Companion {
  packageType: PackageType;
}

interface TicketQuantityProps {
  selectedPackage: PackageType;
  companions: Companion[];
  onCompanionsChange: (companions: Companion[]) => void;
}

const TicketQuantity = ({
  selectedPackage,
  companions,
  onCompanionsChange,
}: TicketQuantityProps) => {
  const pkg = packages.find((p) => p.id === selectedPackage);
  if (!pkg) return null;

  const studentTotal = pkg.studentPrice;
  const companionsTotal = companions.reduce((total, comp) => {
    const compPkg = packages.find((p) => p.id === comp.packageType);
    return total + (compPkg?.nonStudentPrice || 0);
  }, 0);
  const grandTotal = studentTotal + companionsTotal;

  const addCompanion = () => {
    onCompanionsChange([...companions, { packageType: selectedPackage }]);
  };

  const removeCompanion = () => {
    if (companions.length > 0) {
      onCompanionsChange(companions.slice(0, -1));
    }
  };

  const updateCompanionPackage = (index: number, packageType: PackageType) => {
    const updated = [...companions];
    updated[index] = { packageType };
    onCompanionsChange(updated);
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-6">
        {/* Pricing Info */}
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            سعر الطلاب: <span className="font-bold text-foreground">310ج</span> | سعر المرافقين: <span className="font-bold text-foreground">410ج</span>
          </p>
        </div>

        {/* Companions Counter */}
        <div>
          <label className="text-sm font-medium text-foreground">
            عدد المرافقين (إن وجد)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            يمكن لكل مرافق اختيار باكدج مختلف
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={removeCompanion}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={companions.length === 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-16 text-center text-2xl font-bold">{companions.length}</span>
            <button
              type="button"
              onClick={addCompanion}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Companions Package Selection */}
        {companions.length > 0 && (
          <div className="space-y-3">
            <label className="gform-label">اختر باكدج كل مرافق</label>
            {companions.map((companion, index) => (
              <div key={index} className="p-3 rounded-lg border border-border bg-card">
                <p className="text-sm font-medium mb-2">المرافق {index + 1}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateCompanionPackage(index, "without-ski")}
                    className={`flex-1 p-2 rounded-lg border text-sm transition-all flex items-center justify-center gap-2 ${
                      companion.packageType === "without-ski"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>رحلة القاهرة (410ج)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCompanionPackage(index, "with-ski")}
                    className={`relative flex-1 p-2 pt-3 rounded-lg border text-sm transition-all flex items-center justify-center gap-2 ${
                      companion.packageType === "with-ski"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="absolute -top-3 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">وفر 350ج!</span>
                    <Snowflake className="w-4 h-4" />
                    <span>+ Ski Egypt (760ج)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-border">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>تذكرتك (طالب)</span>
              <span>{studentTotal} جنيه</span>
            </div>
            {companions.length > 0 && (
              <div className="flex justify-between">
                <span>المرافقين ({companions.length})</span>
                <span>{companionsTotal} جنيه</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="font-bold text-base">الإجمالي المطلوب تحويله</span>
            <span className="font-bold text-xl text-primary">{grandTotal} جنيه</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQuantity;
export type { Companion };
