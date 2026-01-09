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
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        عدد التذاكر
      </h2>
      <p className="text-muted-foreground mb-6">
        حدد عدد التذاكر لكل نوع
      </p>

      <div className="space-y-6">
        {/* Student Tickets */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">تذاكر الطلاب</h3>
              <p className="text-sm text-muted-foreground">
                {pkg.studentPrice} جنيه للتذكرة
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStudentTicketsChange(Math.max(0, studentTickets - 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                disabled={studentTickets === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xl font-bold">{studentTickets}</span>
              <button
                type="button"
                onClick={() => onStudentTicketsChange(studentTickets + 1)}
                className="w-10 h-10 rounded-full border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {studentTickets > 0 && (
            <div className="text-left text-sm font-medium text-primary">
              = {studentTotal} جنيه
            </div>
          )}
        </div>

        {/* Non-Student Tickets */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">تذاكر غير الطلاب</h3>
              <p className="text-sm text-muted-foreground">
                {pkg.nonStudentPrice} جنيه للتذكرة
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNonStudentTicketsChange(Math.max(0, nonStudentTickets - 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                disabled={nonStudentTickets === 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xl font-bold">{nonStudentTickets}</span>
              <button
                type="button"
                onClick={() => onNonStudentTicketsChange(nonStudentTickets + 1)}
                className="w-10 h-10 rounded-full border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {nonStudentTickets > 0 && (
            <div className="text-left text-sm font-medium text-primary">
              = {nonStudentTotal} جنيه
            </div>
          )}
        </div>

        {/* Total */}
        {(studentTickets > 0 || nonStudentTickets > 0) && (
          <div className="bg-primary/5 rounded-xl border-2 border-primary p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">الإجمالي المطلوب تحويله</span>
              <span className="font-bold text-2xl text-primary">{grandTotal} جنيه</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {studentTickets > 0 && `${studentTickets} تذكرة طالب`}
              {studentTickets > 0 && nonStudentTickets > 0 && " + "}
              {nonStudentTickets > 0 && `${nonStudentTickets} تذكرة غير طالب`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketQuantity;
