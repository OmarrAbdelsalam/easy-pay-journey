import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Search, Download, Eye, X, Calendar, CreditCard, Package, Users, CheckCircle, XCircle, Clock } from "lucide-react";
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
  status: string;
}

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      const statusNames = { pending: "قيد الانتظار", approved: "موافق", rejected: "مرفوض" };
      toast.success(`تم تغيير الحالة إلى ${statusNames[newStatus as keyof typeof statusNames]}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("فشل في تحديث الحالة");
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
      booking.transaction_number.includes(searchTerm) ||
      (booking.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (booking.sender_phone?.includes(searchTerm) ?? false);

    const matchesPackage =
      packageFilter === "all" || booking.selected_package === packageFilter;

    const matchesPayment =
      paymentFilter === "all" || booking.payment_method === paymentFilter;

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesPackage && matchesPayment && matchesStatus;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const totalTickets = filteredBookings.reduce((sum, b) => sum + b.student_tickets + b.companion_tickets, 0);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const exportToCSV = () => {
    const headers = ["رقم الطلب", "الاسم", "الهاتف", "الرقم القومي", "السنة", "الباكدج", "تذاكر طلاب", "تذاكر مرافقين", "طريقة الدفع", "رقم التحويل", "المحول منه", "الإجمالي", "الحالة", "التاريخ"];
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
      b.sender_name || b.sender_phone || "-",
      b.total_price,
      b.status === "pending" ? "قيد الانتظار" : b.status === "approved" ? "موافق" : "مرفوض",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            موافق
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl" dir="rtl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
              <p className="text-sm text-slate-400">أدخل كلمة المرور للدخول</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
    <div className="min-h-screen bg-slate-900 py-4 sm:py-8" dir="rtl">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-sm text-slate-400">إدارة حجوزات رحلة القاهرة</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            تسجيل خروج
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">إجمالي الحجوزات</span>
            </div>
            <p className="text-2xl font-bold text-white">{filteredBookings.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">إجمالي التذاكر</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalTickets}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString()} ج</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث بالاسم، الهاتف، رقم الطلب، المحول منه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="approved">موافق</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="الباكدج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الباكدجات</SelectItem>
                <SelectItem value="with-ski">مع سكي</SelectItem>
                <SelectItem value="without-ski">بدون سكي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="instapay">InstaPay</SelectItem>
                <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                <SelectItem value="orange">Orange Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={exportToCSV} title="تصدير CSV" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th className="text-right p-3 font-medium text-slate-300">رقم الطلب</th>
                  <th className="text-right p-3 font-medium text-slate-300">الاسم</th>
                  <th className="text-right p-3 font-medium text-slate-300">الهاتف</th>
                  <th className="text-right p-3 font-medium text-slate-300">المحول منه</th>
                  <th className="text-right p-3 font-medium text-slate-300">الباكدج</th>
                  <th className="text-right p-3 font-medium text-slate-300">التذاكر</th>
                  <th className="text-right p-3 font-medium text-slate-300">رقم التحويل</th>
                  <th className="text-right p-3 font-medium text-slate-300">الإجمالي</th>
                  <th className="text-right p-3 font-medium text-slate-300">الحالة</th>
                  <th className="text-right p-3 font-medium text-slate-300">الإجراء</th>
                  <th className="text-right p-3 font-medium text-slate-300">الإيصال</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-slate-400">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-8 text-slate-400">
                      لا توجد حجوزات
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="p-3 font-mono text-xs text-slate-300">{booking.order_number}</td>
                      <td className="p-3 font-medium text-white">{booking.customer_name}</td>
                      <td className="p-3 text-slate-300" dir="ltr">{booking.customer_phone}</td>
                      <td className="p-3 text-slate-300">
                        {booking.sender_name || booking.sender_phone || "-"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.selected_package === "with-ski" 
                            ? "bg-primary/20 text-primary" 
                            : "bg-slate-600 text-slate-300"
                        }`}>
                          {booking.selected_package === "with-ski" ? "مع سكي" : "بدون سكي"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{booking.student_tickets + booking.companion_tickets}</td>
                      <td className="p-3 font-mono text-xs text-slate-300">{booking.transaction_number}</td>
                      <td className="p-3 font-bold text-green-400">{Number(booking.total_price).toLocaleString()} ج</td>
                      <td className="p-3">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {booking.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              onClick={() => updateBookingStatus(booking.id, "approved")}
                              title="موافقة"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {booking.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => updateBookingStatus(booking.id, "rejected")}
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {booking.payment_screenshot_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white"
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
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
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
