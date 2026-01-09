import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Search, Filter, Download, Eye, X, Calendar, CreditCard, Package, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DASHBOARD_PASSWORD = "cairo2024";

interface Booking {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_national_id: string;
  customer_year: string;
  selected_package: string;
  student_tickets: number;
  companion_tickets: number;
  payment_method: string;
  transaction_number: string;
  sender_phone: string | null;
  sender_name: string | null;
  payment_screenshot_url: string | null;
  total_price: number;
  created_at: string;
}

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("dashboard_auth", "true");
      toast.success("تم تسجيل الدخول بنجاح");
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("dashboard_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("فشل في تحميل الحجوزات");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("dashboard_auth");
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm) ||
      booking.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.transaction_number.includes(searchTerm);

    const matchesPackage =
      packageFilter === "all" || booking.selected_package === packageFilter;

    const matchesPayment =
      paymentFilter === "all" || booking.payment_method === paymentFilter;

    return matchesSearch && matchesPackage && matchesPayment;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const totalTickets = filteredBookings.reduce((sum, b) => sum + b.student_tickets + b.companion_tickets, 0);

  const exportToCSV = () => {
    const headers = ["رقم الطلب", "الاسم", "الهاتف", "الرقم القومي", "السنة", "الباكدج", "تذاكر طلاب", "تذاكر مرافقين", "طريقة الدفع", "رقم التحويل", "الإجمالي", "التاريخ"];
    const rows = filteredBookings.map((b) => [
      b.order_number,
      b.customer_name,
      b.customer_phone,
      b.customer_national_id,
      b.customer_year,
      b.selected_package === "with-ski" ? "مع سكي" : "بدون سكي",
      b.student_tickets,
      b.companion_tickets,
      b.payment_method,
      b.transaction_number,
      b.total_price,
      new Date(b.created_at).toLocaleDateString("ar-EG"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير البيانات");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="gform-card p-6" dir="rtl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground">أدخل كلمة المرور للدخول</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
              />
              <Button type="submit" className="w-full">
                دخول
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8" dir="rtl">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">إدارة حجوزات رحلة القاهرة</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            تسجيل خروج
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">إجمالي الحجوزات</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{filteredBookings.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">إجمالي التذاكر</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTickets}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalRevenue.toLocaleString()} ج</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">آخر حجز</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {filteredBookings[0] ? new Date(filteredBookings[0].created_at).toLocaleDateString("ar-EG") : "-"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الهاتف، رقم الطلب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="الباكدج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الباكدجات</SelectItem>
                <SelectItem value="with-ski">مع سكي</SelectItem>
                <SelectItem value="without-ski">بدون سكي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="instapay">InstaPay</SelectItem>
                <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                <SelectItem value="orange">Orange Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={exportToCSV} title="تصدير CSV">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right p-3 font-medium text-muted-foreground">رقم الطلب</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الاسم</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الهاتف</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">السنة</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الباكدج</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">التذاكر</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الدفع</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">رقم التحويل</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الإجمالي</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">الإيصال</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-muted-foreground">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-muted-foreground">
                      لا توجد حجوزات
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{booking.order_number}</td>
                      <td className="p-3 font-medium">{booking.customer_name}</td>
                      <td className="p-3" dir="ltr">{booking.customer_phone}</td>
                      <td className="p-3">{booking.customer_year}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.selected_package === "with-ski" 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {booking.selected_package === "with-ski" ? "مع سكي" : "بدون سكي"}
                        </span>
                      </td>
                      <td className="p-3">{booking.student_tickets + booking.companion_tickets}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-muted">
                          {booking.payment_method}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">{booking.transaction_number}</td>
                      <td className="p-3 font-bold text-primary">{Number(booking.total_price).toLocaleString()} ج</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-3">
                        {booking.payment_screenshot_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 left-0 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <img 
              src={selectedImage} 
              alt="إيصال الدفع" 
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
