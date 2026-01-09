import { Check } from "lucide-react";

interface ParticipantTypeProps {
  selectedType: "student" | "non-student" | null;
  onSelect: (type: "student" | "non-student") => void;
}

const ParticipantType = ({ selectedType, onSelect }: ParticipantTypeProps) => {
  const options = [
    {
      id: "student" as const,
      title: "طالب",
      subtitle: "Student",
      price: "310 جنيه",
      description: "سعر مخفض للطلاب من كل المراحل العمرية",
    },
    {
      id: "non-student" as const,
      title: "غير طالب",
      subtitle: "Non-Student",
      price: "410 جنيه",
      description: "السعر الأساسي للرحلة",
    },
  ];

  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        نوع المشترك
      </h2>
      <p className="text-muted-foreground mb-6">
        اختر نوع الاشتراك المناسب ليك
      </p>

      <div className="grid gap-4">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`addon-card flex items-center justify-between ${
              selectedType === option.id ? "selected" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedType === option.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                }`}
              >
                {selectedType === option.id && (
                  <Check className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {option.title}
                  <span className="text-muted-foreground text-sm mr-2">
                    ({option.subtitle})
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-primary">{option.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantType;
