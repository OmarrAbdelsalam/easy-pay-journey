import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { packages, PackageType } from "./PackageSelection";

type CompanionType = "student" | "graduate" | "senior" | "child";

interface Companion {
  type: CompanionType;
  packageType: PackageType;
}

interface TicketQuantityProps {
  selectedPackage: PackageType;
  companions: Companion[];
  onCompanionsChange: (companions: Companion[]) => void;
  onPendingChange?: (isPending: boolean) => void;
}

const companionTypes = [
  { id: "student" as const, label: "طالب" },
  { id: "graduate" as const, label: "خريج" },
  { id: "senior" as const, label: "كبار سن (فوق 65 سنة)" },
  { id: "child" as const, label: "طفل" },
];

const TicketQuantity = ({
  selectedPackage,
  companions,
  onCompanionsChange,
  onPendingChange
}: TicketQuantityProps) => {
  const [addingCompanion, setAddingCompanion] = useState(false);
  const [selectedType, setSelectedType] = useState<CompanionType | null>(null);

  const pkg = packages.find(p => p.id === selectedPackage);
  if (!pkg) return null;

  const updateAddingState = (isAdding: boolean) => {
    setAddingCompanion(isAdding);
    onPendingChange?.(isAdding);
  };

  const getCompanionPrice = (companion: Companion) => {
    const basePkg = packages.find(p => p.id === companion.packageType);
    
    if (companion.type === "student" || companion.type === "child" || companion.type === "senior") {
      return basePkg?.studentPrice || 0;
    } else {
      // خريجين فقط
      return basePkg?.nonStudentPrice || 0;
    }
  };

  const studentTotal = pkg.studentPrice;
  const companionsTotal = companions.reduce((total, comp) => {
    return total + getCompanionPrice(comp);
  }, 0);
  const grandTotal = studentTotal + companionsTotal;

  const addCompanion = () => {
    updateAddingState(true);
    setSelectedType(null);
  };

  const removeCompanion = () => {
    // لو في مربع إضافة مفتوح، امسحه
    if (addingCompanion) {
      updateAddingState(false);
      setSelectedType(null);
    }
  };

  const removeCompanionByIndex = (index: number) => {
    const updated = companions.filter((_, i) => i !== index);
    onCompanionsChange(updated);
  };

  const handleTypeSelect = (type: CompanionType) => {
    setSelectedType(type);
  };

  const handlePackageSelect = (packageType: PackageType) => {
    if (selectedType) {
      const newCompanion: Companion = {
        type: selectedType,
        packageType: packageType
      };
      onCompanionsChange([...companions, newCompanion]);
      updateAddingState(false);
      setSelectedType(null);
    }
  };

  const cancelAddCompanion = () => {
    updateAddingState(false);
    setSelectedType(null);
  };

  const updateCompanionPackage = (index: number, packageType: PackageType) => {
    const updated = [...companions];
    updated[index] = { ...updated[index], packageType };
    onCompanionsChange(updated);
  };

  const getTypeLabel = (type: CompanionType) => {
    return companionTypes.find(t => t.id === type)?.label || "";
  };

  const getCompanionPackagePrice = (type: CompanionType, packageType: PackageType) => {
    if (type === "student" || type === "child" || type === "senior") {
      return packageType === "with-ski" ? 660 : 310;
    } else {
      return packageType === "with-ski" ? 760 : 410;
    }
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-6 md:space-y-8">
        {/* Pricing Info */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-sm md:text-base text-muted-foreground">
            سعر الطلاب والأطفال وكبار السن (فوق 65 سنة): <span className="font-bold text-foreground">310ج</span> | 
            سعر الخريجين: <span className="font-bold text-foreground">410ج</span>
          </p>
        </div>

        {/* Companions Counter */}
        <div>
          <label className="text-sm md:text-base font-medium text-foreground">
            عدد المرافقين (إن وجد)
          </label>
          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
            يمكن لكل مرافق اختيار باكدج مختلف
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={removeCompanion}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={!addingCompanion}
            >
              <Minus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span className="w-16 text-center text-2xl md:text-3xl font-bold">{companions.length + (addingCompanion ? 1 : 0)}</span>
            <button
              type="button"
              onClick={addCompanion}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Add Companion Flow - Same style as existing companions */}
        {addingCompanion && (
          <div className="space-y-3 md:space-y-4">
            <label className="gform-label md:text-base">إضافة مرافق جديد</label>
            <div className="p-3 md:p-4 rounded-lg border border-border bg-card relative">
              <button
                type="button"
                onClick={cancelAddCompanion}
                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {!selectedType ? (
                <>
                  <p className="text-sm md:text-base font-medium mb-2 md:mb-3">
                    المرافق {companions.length + 1} - اختر النوع
                  </p>
                  <div className="flex gap-2 md:gap-3">
                    {companionTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeSelect(type.id)}
                        className="flex-1 p-2 md:p-3 rounded-lg border text-sm md:text-base transition-all flex items-center justify-center border-border hover:border-primary/30"
                      >
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm md:text-base font-medium mb-2 md:mb-3">
                    المرافق {companions.length + 1} - {getTypeLabel(selectedType)}
                  </p>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => handlePackageSelect("without-ski")}
                      className="flex-1 p-2 md:p-3 rounded-lg border text-sm md:text-base transition-all flex items-center justify-center border-border hover:border-primary/30"
                    >
                      <span>رحلة القاهرة ({getCompanionPackagePrice(selectedType, "without-ski")}ج)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePackageSelect("with-ski")}
                      className="relative flex-1 p-2 md:p-3 pt-3 md:pt-4 rounded-lg border text-sm md:text-base transition-all flex items-center justify-center border-border hover:border-primary/30"
                    >
                      <span className="absolute -top-3 left-2 bg-primary text-primary-foreground text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded">
                        وفر 350ج!
                      </span>
                      <span>+ Ski Egypt ({getCompanionPackagePrice(selectedType, "with-ski")}ج)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Existing Companions List */}
        {companions.length > 0 && (
          <div className="space-y-3 md:space-y-4">
            <label className="gform-label md:text-base">المرافقين المضافين</label>
            {companions.map((companion, index) => (
              <div key={index} className="p-3 md:p-4 rounded-lg border border-border bg-card relative">
                <button
                  type="button"
                  onClick={() => removeCompanionByIndex(index)}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <p className="text-sm md:text-base font-medium">
                    المرافق {index + 1} - {getTypeLabel(companion.type)}
                  </p>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => updateCompanionPackage(index, "without-ski")}
                    className={`flex-1 p-2 md:p-3 rounded-lg border text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                      companion.packageType === "without-ski"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span>رحلة القاهرة ({getCompanionPackagePrice(companion.type, "without-ski")}ج)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCompanionPackage(index, "with-ski")}
                    className={`relative flex-1 p-2 md:p-3 pt-3 md:pt-4 rounded-lg border text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                      companion.packageType === "with-ski"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="absolute -top-3 left-2 bg-primary text-primary-foreground text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded">
                      وفر 350ج!
                    </span>
                    <span>+ Ski Egypt ({getCompanionPackagePrice(companion.type, "with-ski")}ج)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="pt-4 md:pt-5 border-t border-border">
          <div className="space-y-2 md:space-y-3 text-sm md:text-base">
            <div className="flex justify-between">
              <span>تذكرتك (طالب) - {selectedPackage === "with-ski" ? "رحلة القاهرة + Ski Egypt" : "رحلة القاهرة"}</span>
              <span>{studentTotal} جنيه</span>
            </div>
            {companions.length > 0 && (
              <div className="flex justify-between">
                <span>المرافقين ({companions.length})</span>
                <span>{companionsTotal} جنيه</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border">
            <span className="font-medium text-sm md:text-base">الإجمالي المطلوب تحويله</span>
            <span className="font-semibold text-base md:text-lg text-primary">{grandTotal} جنيه</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketQuantity;
export type { Companion, CompanionType };