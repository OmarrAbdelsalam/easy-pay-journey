interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="w-full space-y-2" dir="rtl">
      {/* Mobile Active Step Summary */}
      <div className="flex sm:hidden items-center justify-between text-xs font-bold px-0.5 mb-1">
        <span className="text-primary font-black text-xs">
          الخطوة {currentStep} من {totalSteps}: {labels[currentStep - 1]}
        </span>
        <span className="text-muted-foreground/60 text-[11px] font-mono">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>

      <div className="flex items-center w-full gap-2 sm:gap-3">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col w-full gap-1.5 sm:gap-2">
              <span
                className={`text-[11px] sm:text-xs font-bold transition-colors truncate ${
                  isActive
                    ? "text-primary font-black"
                    : isCompleted
                    ? "text-primary/70"
                    : "text-muted-foreground/40"
                }`}
              >
                <span className="opacity-60 ml-0.5 sm:ml-1 font-mono">{stepNumber.toString().padStart(2, '0')}</span> 
                <span className="hidden sm:inline">{labels[index]}</span>
              </span>
              <div
                className={`h-1.5 rounded-full w-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary shadow-xs"
                    : isCompleted
                    ? "bg-primary/50"
                    : "bg-border/60"
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
