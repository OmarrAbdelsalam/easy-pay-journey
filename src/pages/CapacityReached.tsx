import { Link } from "react-router-dom";
import { AlertCircle, Clock } from "lucide-react";
import heroImage from "@/assets/cairo-trip-hero.webp";
import { Button } from "@/components/ui/button";

const CapacityReached = () => {
  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm h-32 sm:h-40 md:h-48">
          <img src={heroImage} alt="رحلة القاهرة" className="w-full h-[166%] object-[center_100%] object-cover" />
        </div>

        <div className="gform-card p-6 sm:p-8 text-center" dir="rtl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            الأماكن اكتملت! 🎉
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">
            للأسف وصلنا للحد الأقصى من الحجوزات
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">مش كده وخلاص!</span>
            </div>
            <p className="text-amber-700 text-sm">
              ممكن تسجل في قائمة الانتظار وهنتواصل معاك لو حد لغى حجزه
            </p>
          </div>

          <Link to="/waiting-list">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 px-8">
              سجل في قائمة الانتظار
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CapacityReached;
