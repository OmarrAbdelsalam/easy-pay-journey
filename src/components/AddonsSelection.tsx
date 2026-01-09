import { Check, Utensils, Camera, Bus, Tent } from "lucide-react";

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

interface AddonsSelectionProps {
  selectedAddons: string[];
  onToggle: (addonId: string) => void;
}

const addons: Addon[] = [
  {
    id: "meals",
    name: "وجبات كاملة",
    description: "فطار وغدا وعشا طول الرحلة",
    price: 150,
    icon: <Utensils className="w-6 h-6" />,
  },
  {
    id: "photography",
    name: "تصوير احترافي",
    description: "مصور محترف لتوثيق اللحظات",
    price: 100,
    icon: <Camera className="w-6 h-6" />,
  },
  {
    id: "transport",
    name: "مواصلات VIP",
    description: "أتوبيس مكيف ومريح",
    price: 75,
    icon: <Bus className="w-6 h-6" />,
  },
  {
    id: "camping",
    name: "معدات التخييم",
    description: "خيمة وحقيبة نوم ومستلزمات",
    price: 200,
    icon: <Tent className="w-6 h-6" />,
  },
];

const AddonsSelection = ({ selectedAddons, onToggle }: AddonsSelectionProps) => {
  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        الإضافات
      </h2>
      <p className="text-muted-foreground mb-6">
        اختر الإضافات اللي تحب تضيفها للرحلة (اختياري)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addons.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id);
          return (
            <div
              key={addon.id}
              onClick={() => onToggle(addon.id)}
              className={`addon-card ${isSelected ? "selected" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {addon.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      {addon.name}
                    </h3>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {addon.description}
                  </p>
                  <p className="text-primary font-bold mt-2">
                    +{addon.price} جنيه
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { addons };
export default AddonsSelection;
