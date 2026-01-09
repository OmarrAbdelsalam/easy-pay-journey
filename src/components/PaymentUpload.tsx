import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";
import instapayLogo from "@/assets/instapay-logo.png";
import vodafoneLogo from "@/assets/vodafone-logo.png";
import orangeLogo from "@/assets/orange-logo.png";
import { PackageType, packages } from "./PackageSelection";

export type PaymentMethod = "instapay" | "vodafone" | "orange" | null;

interface PaymentUploadProps {
  selectedPackage: PackageType;
  studentTickets: number;
  nonStudentTickets: number;
  selectedMethod: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  paymentScreenshot: File | null;
  onScreenshotChange: (file: File | null) => void;
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
  studentTickets,
  nonStudentTickets,
  selectedMethod,
  onMethodSelect,
  paymentScreenshot,
  onScreenshotChange,
}: PaymentUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pkg = packages.find((p) => p.id === selectedPackage);
  const total = pkg
    ? studentTickets * pkg.studentPrice + nonStudentTickets * pkg.nonStudentPrice
    : 0;

  const selectedPayment = paymentMethods.find((p) => p.id === selectedMethod);

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
      <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        الدفع ورفع السكرين
      </h2>
      <p className="text-muted-foreground mb-6">
        حول المبلغ وارفع سكرين التحويل
      </p>

      <div className="space-y-6">
        {/* Amount to Pay */}
        <div className="bg-primary/5 rounded-xl border-2 border-primary p-4 text-center">
          <p className="text-muted-foreground mb-1">المبلغ المطلوب تحويله</p>
          <p className="text-3xl font-bold text-primary">{total} جنيه</p>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            اختر طريقة الدفع <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => onMethodSelect(method.id)}
                className={`payment-option flex items-center justify-center p-2 sm:p-4 overflow-hidden ${
                  selectedMethod === method.id ? "selected" : ""
                }`}
              >
                <img
                  src={method.logo}
                  alt={method.name}
                  className={`w-full object-contain ${
                    method.id === "instapay" || method.id === "vodafone"
                      ? "h-12 sm:h-20 scale-125 sm:scale-150"
                      : "h-10 sm:h-16 scale-110 sm:scale-125"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        {selectedPayment && (
          <div className="animate-slide-up bg-muted/50 rounded-xl p-4">
            <h4 className="font-semibold text-foreground mb-3">تعليمات التحويل</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-card rounded-lg p-3">
                <span className="text-muted-foreground">الرقم:</span>
                <span className="font-mono font-bold text-lg" dir="ltr">
                  {selectedPayment.number}
                </span>
              </div>
              {selectedPayment.holderName && (
                <div className="flex justify-between items-center bg-card rounded-lg p-3">
                  <span className="text-muted-foreground">اسم المستفيد:</span>
                  <span className="font-bold">{selectedPayment.holderName}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-card rounded-lg p-3">
                <span className="text-muted-foreground">المبلغ:</span>
                <span className="font-bold text-primary">{total} جنيه</span>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            سكرين بالتحويل <span className="text-destructive">*</span>
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!paymentScreenshot ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">
                اضغط لرفع سكرين التحويل
              </p>
              <p className="text-sm text-muted-foreground">
                الحد الأقصى لحجم الملف: 10 MB
              </p>
            </div>
          ) : (
            <div className="relative border-2 border-primary rounded-xl overflow-hidden">
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <div className="bg-success text-success-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Payment screenshot"
                  className="w-full max-h-64 object-contain bg-muted"
                />
              ) : (
                <div className="p-4 flex items-center gap-3">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-foreground">{paymentScreenshot.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentUpload;
