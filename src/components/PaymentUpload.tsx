import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import instapayLogo from "@/assets/instapay-logo.png";
import vodafoneLogo from "@/assets/vodafone-logo.png";
import orangeLogo from "@/assets/orange-logo.png";
import { PackageType, packages } from "./PackageSelection";
import { Companion } from "./TicketQuantity";

export type PaymentMethod = "instapay" | "vodafone" | "orange" | null;

export interface PaymentDetails {
  transactionNumber: string;
  senderPhone: string;
  senderName: string;
}

interface PaymentUploadProps {
  selectedPackage: PackageType;
  companions: Companion[];
  selectedMethod: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  paymentScreenshot: File | null;
  onScreenshotChange: (file: File | null) => void;
  paymentDetails: PaymentDetails;
  onPaymentDetailsChange: (details: PaymentDetails) => void;
}

const paymentMethods = [
  {
    id: "instapay" as const,
    name: "InstaPay",
    logo: instapayLogo,
    number: "01012345678",
    holderName: "رحلات مصر",
  },
  {
    id: "vodafone" as const,
    name: "Vodafone Cash",
    logo: vodafoneLogo,
    number: "01012345678",
  },
  {
    id: "orange" as const,
    name: "Orange Cash",
    logo: orangeLogo,
    number: "01212345678",
  },
];

const PaymentUpload = ({
  selectedPackage,
  companions,
  selectedMethod,
  onMethodSelect,
  paymentScreenshot,
  onScreenshotChange,
  paymentDetails,
  onPaymentDetailsChange,
}: PaymentUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pkg = packages.find((p) => p.id === selectedPackage);
  const studentTotal = pkg?.studentPrice || 0;
  const companionsTotal = companions.reduce((total, comp) => {
    const compPkg = packages.find((p) => p.id === comp.packageType);
    return total + (compPkg?.nonStudentPrice || 0);
  }, 0);
  const total = studentTotal + companionsTotal;

  const selectedPayment = paymentMethods.find((p) => p.id === selectedMethod);

  // Calculate transfer fee for Vodafone/Orange
  const calculateTransferFee = (amount: number): number => {
    if (selectedMethod === "instapay") return 0;
    return Math.max(5, Math.floor(amount / 500) * 5);
  };

  const transferFee = calculateTransferFee(total);
  const grandTotal = total + transferFee;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onScreenshotChange(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    onScreenshotChange(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="space-y-6">
        {/* Amount to Pay - Always simple style */}
        <div className="text-center py-3 border-b border-border">
          <p className="text-muted-foreground text-sm mb-1">المبلغ المطلوب تحويله</p>
          <p className="text-2xl font-bold text-primary">
            {(selectedMethod === "vodafone" || selectedMethod === "orange") ? grandTotal : total} جنيه
          </p>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="gform-label">
            اختر طريقة الدفع <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => onMethodSelect(method.id)}
                className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center overflow-hidden ${
                  selectedMethod === method.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/30"
                }`}
              >
                <img
                  src={method.logo}
                  alt={method.name}
                  className={`w-full object-contain ${
                    method.id === "instapay" || method.id === "vodafone"
                      ? "h-10 sm:h-14 scale-125 sm:scale-150"
                      : "h-8 sm:h-12 scale-110 sm:scale-125"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        {selectedPayment && (
          <div className="animate-fade-in bg-muted/30 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3">تعليمات التحويل</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الرقم:</span>
                <span className="font-mono font-bold text-lg" dir="ltr">
                  {selectedPayment.number}
                </span>
              </div>
              {selectedPayment.holderName && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">اسم المستفيد:</span>
                  <span className="font-bold">{selectedPayment.holderName}</span>
                </div>
              )}
              {(selectedMethod === "vodafone" || selectedMethod === "orange") && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">سعر التذاكر:</span>
                    <span className="font-medium">{total} جنيه</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">رسوم التحويل:</span>
                    <span className="font-medium">{transferFee} جنيه</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المبلغ:</span>
                <span className="font-bold text-primary">
                  {(selectedMethod === "vodafone" || selectedMethod === "orange") ? grandTotal : total} جنيه
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Inputs */}
        {selectedMethod && (
          <div className="animate-fade-in space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                رقم المعاملة <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={paymentDetails.transactionNumber}
                onChange={(e) =>
                  onPaymentDetailsChange({ ...paymentDetails, transactionNumber: e.target.value })
                }
                placeholder="أدخل رقم المعاملة من التحويل"
                className="gform-input text-sm"
                dir="ltr"
              />
            </div>

            {(selectedMethod === "vodafone" || selectedMethod === "orange") && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                  الرقم اللي حولت منه <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={paymentDetails.senderPhone}
                  onChange={(e) =>
                    onPaymentDetailsChange({ ...paymentDetails, senderPhone: e.target.value })
                  }
                  placeholder="01xxxxxxxxx"
                  className="gform-input text-sm"
                  dir="ltr"
                />
              </div>
            )}

            {selectedMethod === "instapay" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 text-right">
                  الاسم على الحساب <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={paymentDetails.senderName}
                  onChange={(e) =>
                    onPaymentDetailsChange({ ...paymentDetails, senderName: e.target.value })
                  }
                  placeholder="الاسم المسجل على InstaPay"
                  className="gform-input text-sm text-right"
                />
              </div>
            )}
          </div>
        )}

        {/* File Upload - Only show when payment method is selected */}
        {selectedMethod && (
          <div>
            <label className="gform-label">
              سكرين بالتحويل <span className="text-destructive">*</span>
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              يمكنك تحميل ملف واحد متوافق. الحد الأقصى لحجم الملف: 10 MB
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!paymentScreenshot ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground font-medium">
                  اضغط لرفع الصورة
                </p>
              </button>
            ) : (
              <div className="relative border border-primary rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Payment screenshot"
                    className="w-full max-h-48 object-contain bg-muted"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentUpload;
