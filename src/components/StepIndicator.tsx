interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center w-full gap-3" dir="rtl">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex flex-col w-full gap-2">
            <span
              className={`text-xs font-bold transition-colors ${
                isActive
                  ? "text-primary"
                  : isCompleted
                  ? "text-primary/60"
                  : "text-muted-foreground/40"
              }`}
            >
              <span className="opacity-50 ml-1">{stepNumber.toString().padStart(2, '0')}</span> 
              {labels[index]}
            </span>
            <div
              className={`h-0.5 w-full rounded-full transition-all duration-500 ${
                isActive
                  ? "bg-primary"
                  : isCompleted
                  ? "bg-primary/20"
                  : "bg-border/60"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
