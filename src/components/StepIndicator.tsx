import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center w-full mb-6 md:mb-8 overflow-x-auto px-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-accent text-accent-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] md:text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {labels[index]}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-6 md:w-16 h-0.5 mx-1 md:mx-2 rounded-full transition-colors duration-300 ${
                  isCompleted ? "bg-accent" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
