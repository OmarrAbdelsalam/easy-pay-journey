import { useState } from "react";
import { Smartphone, CreditCard, Wallet } from "lucide-react";

export type PaymentMethod = "instapay" | "vodafone" | "orange" | null;

interface PaymentSelectionProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  transactionRef: string;
  onTransactionRefChange: (ref: string) => void;
}

const paymentMethods = [
  {
    id: "instapay" as const,
    name: "InstaPay",
    icon: <CreditCard className="w-6 h-6" />,
    color: "text-instapay",
    bgColor: "bg-instapay/10",
    instructions: "حول المبلغ على رقم: 01012345678\nاسم المستفيد: رحلات مصر",
  },
  {
    id: "vodafone" as const,
    name: "Vodafone Cash",
    icon: <Smartphone className="w-6 h-6" />,
    color: "text-vodafone",
    bgColor: "bg-vodafone/10",
    instructions: "حول المبلغ على رقم: 01012345678\nفودافون كاش",
  },
  {
    id: "orange" as const,
    name: "Orange Cash",
    icon: <Wallet className="w-6 h-6" />,
    color: "text-orange",
    bgColor: "bg-orange/10",
    instructions: "حول المبلغ على رقم: 01212345678\nأورانج كاش",
  },
];

const PaymentSelection = ({
  selectedMethod,
  onSelect,
  transactionRef,
  onTransactionRefChange,
}: PaymentSelectionProps) => {
  const selectedPayment = paymentMethods.find((p) => p.id === selectedMethod);

  return (
    <div className="animate-fade-in" dir="rtl">
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        طريقة الدفع
      </h2>
      <p className="text-muted-foreground mb-6">
        اختر طريقة الدفع المناسبة ليك
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`payment-option text-center ${
              selectedMethod === method.id ? "selected" : ""
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full ${method.bgColor} ${method.color} flex items-center justify-center mx-auto mb-3`}
            >
              {method.icon}
            </div>
            <h3 className="font-semibold text-foreground">{method.name}</h3>
          </div>
        ))}
      </div>

      {selectedPayment && (
        <div className="animate-slide-up space-y-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-semibold text-foreground mb-2">
              تعليمات الدفع
            </h4>
            <p className="text-muted-foreground whitespace-pre-line text-sm">
              {selectedPayment.instructions}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              رقم المعاملة / Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => onTransactionRefChange(e.target.value)}
              placeholder="أدخل رقم المعاملة بعد التحويل"
              className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-2">
              * رقم المعاملة مهم للتحقق من الدفع
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSelection;
