import { Minus, Plus } from "lucide-react";
import { PackageType } from "./PackageSelection";

type CompanionType = "standard";

interface Companion {
  type: CompanionType;
  packageType: PackageType;
}

interface TicketQuantityProps {
  selectedPackage: PackageType;
  companions: Companion[];
  onCompanionsChange: (companions: Companion[]) => void;
  onPendingChange?: (isPending: boolean) => void;
  isGrad?: boolean;
}

const TicketQuantity = ({
  selectedPackage,
  companions,
  onCompanionsChange,
}: TicketQuantityProps) => {

  const studentTotal = 270;
  const companionsTotal = companions.length * 270;
  const grandTotal = studentTotal + companionsTotal;

  const addCompanion = () => {
    onCompanionsChange([...companions, { type: "standard", packageType: "iftar" }]);
  };

  const removeCompanion = () => {
    if (companions.length > 0) {
      const updated = [...companions];
      updated.pop();
      onCompanionsChange(updated);
    }
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-6 md:space-y-8">
        <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-sm md:text-base text-muted-foreground flex items-center justify-between">
            <span>سعر التيكت الموحد:</span>
            <span className="font-bold text-foreground">270ج</span>
          </p>
        </div>

        <div>
          <label className="text-sm md:text-base font-medium text-foreground">
            عدد المرافقين (إن وجد)
          </label>
          <div className="flex items-center gap-4 md:gap-6 mt-4">
            <button
              type="button"
              onClick={removeCompanion}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
              disabled={companions.length === 0}
            >
              <Minus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span className="w-16 text-center text-2xl md:text-3xl font-bold">{companions.length}</span>
            <button
              type="button"
              onClick={addCompanion}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="pt-4 md:pt-5 border-t border-border">
          <div className="space-y-2 md:space-y-3 text-sm md:text-base">
            <div className="flex justify-between">
              <span>تذكرتك الأساسية</span>
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