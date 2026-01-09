import { Minus, Plus } from "lucide-react";
import { PackageType, packages } from "./PackageSelection";

interface TicketQuantityProps {
  selectedPackage: PackageType;
  studentTickets: number;
  nonStudentTickets: number;
  onStudentTicketsChange: (count: number) => void;
  onNonStudentTicketsChange: (count: number) => void;
}

const TicketQuantity = ({
  selectedPackage,
  studentTickets,
  nonStudentTickets,
  onStudentTicketsChange,
  onNonStudentTicketsChange,
}: TicketQuantityProps) => {
  const pkg = packages.find((p) => p.id === selectedPackage);
  if (!pkg) return null;

  const studentTotal = studentTickets * pkg.studentPrice;
  const nonStudentTotal = nonStudentTickets * pkg.nonStudentPrice;
  const grandTotal = studentTotal + nonStudentTotal;

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-6">
        {/* Student Tickets */}
        <div>
          <label className="gform-label">
            عدد تذاكر الطلاب <span className="text-destructive">*</span>
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            {pkg.studentPrice} جنيه للتذكرة
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onStudentTicketsChange(Math.max(0, studentTickets - 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={studentTickets === 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-16 text-center text-2xl font-bold">{studentTickets}</span>
            <button
              type="button"
              onClick={() => onStudentTicketsChange(studentTickets + 1)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {studentTickets > 0 && (
              <span className="text-sm text-muted-foreground">
                = {studentTotal} جنيه
              </span>
            )}
          </div>
        </div>

        {/* Non-Student Tickets */}
        <div>
          <label className="gform-label">
            عدد تذاكر غير الطلاب (إن وجد)
          </label>
          <p className="text-sm text-muted-foreground mb-3">
            {pkg.nonStudentPrice} جنيه للتذكرة
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNonStudentTicketsChange(Math.max(0, nonStudentTickets - 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={nonStudentTickets === 0}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-16 text-center text-2xl font-bold">{nonStudentTickets}</span>
            <button
              type="button"
              onClick={() => onNonStudentTicketsChange(nonStudentTickets + 1)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {nonStudentTickets > 0 && (
              <span className="text-sm text-muted-foreground">
                = {nonStudentTotal} جنيه
              </span>
            )}
          </div>
        </div>

        {/* Total */}
        {(studentTickets > 0 || nonStudentTickets > 0) && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">الإجمالي المطلوب تحويله</span>
              <span className="font-bold text-2xl text-primary">{grandTotal} جنيه</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketQuantity;
