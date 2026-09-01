interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="w-full" dir="rtl">
      <div className="grid grid-cols-4 w-full gap-2 sm:gap-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col w-full gap-2">
              <div
                className={`text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 ${
                  isActive
                    ? "text-primary font-bold"
                    : isCompleted
                    ? "text-primary/70 font-medium"
                    : "text-muted-foreground/40 font-medium"
                }`}
              >
                <span className="font-mono text-[11px] sm:text-xs opacity-70">
                  {stepNumber.toString().padStart(2, '0')}
                </span>
                <span className="truncate">{labels[index]}</span>
              </div>
              <div
                className={`h-[2px] w-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary"
                    : isCompleted
                    ? "bg-primary/40"
                    : "bg-muted-foreground/20"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
