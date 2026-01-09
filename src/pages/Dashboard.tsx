import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Search, Download, Eye, X, CreditCard, Package, Users, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DASHBOARD_PASSWORD = "cairo2024";

interface CompanionDetail {
  index: number;
  packageType: string;
}

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
  companions_details: CompanionDetail[] | null;
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
  const [warningsExpanded, setWarningsExpanded] = useState(true);

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
      const bookingsData = (data || []).map(b => ({
        ...b,
        companions_details: Array.isArray(b.companions_details) 
          ? (b.companions_details as unknown as CompanionDetail[]) 
          : []
      }));
      setBookings(bookingsData);
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

  const approveAllPending = async () => {
    const pendingBookings = filteredBookings.filter(b => b.status === "pending");
    if (pendingBookings.length === 0) {
      toast.info("لا توجد حجوزات قيد الانتظار");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "approved" })
        .in("id", pendingBookings.map(b => b.id));

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        pendingBookings.some(pb => pb.id === b.id) ? { ...b, status: "approved" } : b
      ));

      toast.success(`تم الموافقة على ${pendingBookings.length} حجز`);
    } catch (error) {
      console.error("Error approving all:", error);
      toast.error("فشل في الموافقة على الحجوزات");
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

  const getDuplicateCount = (booking: Booking, field: 'sender' | 'transaction') => {
    if (field === 'sender') {
      const senderValue = booking.sender_name || booking.sender_phone;
      if (!senderValue) return 0;
      return bookings.filter(b => 
        b.id !== booking.id && 
        ((b.sender_name && b.sender_name === booking.sender_name) || 
         (b.sender_phone && b.sender_phone === booking.sender_phone))
      ).length;
    } else {
      if (!booking.transaction_number) return 0;
      return bookings.filter(b => 
        b.id !== booking.id && 
        b.transaction_number === booking.transaction_number
      ).length;
    }
  };

  const paymentMethodLabels: Record<string, string> = {
    instapay: "InstaPay",
    vodafone: "Vodafone",
    orange: "Orange"
  };

  const exportToCSV = () => {
    const headers = ["رقم الطلب", "الاسم", "الهاتف", "الرقم القومي", "السنة", "الباكدج", "تذاكر طلاب", "تذاكر مرافقين", "وسيلة الدفع", "رقم المعاملة", "المحول منه", "الإجمالي", "الحالة", "التاريخ"];
    const rows = filteredBookings.map((b) => [
      b.order_number,
      b.customer_name,
      b.customer_phone,
      b.customer_national_id,
      b.customer_year,
      b.selected_package === "with-ski" ? "مع سكي" : "بدون سكي",
      b.student_tickets,
      b.companion_tickets,
      paymentMethodLabels[b.payment_method] || b.payment_method,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg" dir="rtl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
              <p className="text-sm text-gray-500">أدخل كلمة المرور للدخول</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8" dir="rtl">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-sm text-gray-500">إدارة حجوزات رحلة القاهرة</p>
          </div>
          <Button variant="outline" size="sm" className="bg-gray-100 hover:bg-gray-200" onClick={handleLogout}>
            تسجيل خروج
          </Button>
        </div>

        {/* Duplicates Warning Section - Collapsible */}
        {(() => {
          const warningBookings = bookings.filter(b => 
            getDuplicateCount(b, 'sender') > 0 || getDuplicateCount(b, 'transaction') > 0
          );
          
          if (warningBookings.length === 0) return null;
          
          return (
            <div className="mb-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header - Clickable */}
                <button
                  onClick={() => setWarningsExpanded(!warningsExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-800">⚠️ حجوزات تحتاج مراجعة ({warningBookings.length})</h3>
                  </div>
                  {warningsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {/* Content */}
                {warningsExpanded && (
                  <div className="p-4 space-y-4">
                    {warningBookings.map((booking) => {
                      const senderDupes = getDuplicateCount(booking, 'sender');
                      const transactionDupes = getDuplicateCount(booking, 'transaction');
                      
                      return (
                        <div key={booking.id} className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                          {/* Warning Tags */}
                          <div className="bg-white px-4 py-2 flex flex-wrap gap-2 border-b border-gray-200">
                            {transactionDupes > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                رقم معاملة مكرر في {transactionDupes} حجز آخر
                              </span>
                            )}
                            {senderDupes > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                محول منه مكرر في {senderDupes} حجز آخر
                              </span>
                            )}
                          </div>
                          
                          {/* Booking Details */}
                          <div className="p-4 bg-white">
                            <div className="flex flex-wrap gap-4 items-start">
                              {/* Customer Info */}
                              <div className="flex-1 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs text-gray-500">{booking.order_number}</span>
                                  {getStatusBadge(booking.status)}
                                </div>
                                <h3 className="font-bold text-gray-900">{booking.customer_name}</h3>
                                <p className="text-sm text-gray-500" dir="ltr">{booking.customer_phone}</p>
                                <p className="text-xs text-gray-400">{booking.customer_year}</p>
                              </div>
                              
                              {/* Payment Info */}
                              <div className="min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                    {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-100">
                                  <div className="text-xs text-gray-600">المحول منه:</div>
                                  <div className="font-medium text-gray-900">{booking.sender_name || booking.sender_phone || "-"}</div>
                                </div>
                                <div className="p-2 rounded-lg mt-2 bg-gray-100">
                                  <div className="text-xs text-gray-600">رقم المعاملة:</div>
                                  <div className="font-mono font-medium text-gray-900">{booking.transaction_number}</div>
                                </div>
                              </div>
                              
                              {/* Package & Price */}
                              <div className="min-w-[100px]">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {booking.selected_package === "with-ski" ? "مع سكي" : "بدون سكي"}
                                </span>
                                <p className="text-lg font-bold text-gray-900 mt-2">{Number(booking.total_price).toLocaleString()} ج</p>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                {booking.status === "pending" ? (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => updateBookingStatus(booking.id, "approved")}
                                    >
                                      <CheckCircle className="w-4 h-4 ml-1" />
                                      موافقة
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => updateBookingStatus(booking.id, "rejected")}
                                    >
                                      <XCircle className="w-4 h-4 ml-1" />
                                      رفض
                                    </Button>
                                  </>
                                ) : (
                                  <Select
                                    value={booking.status}
                                    onValueChange={(value) => updateBookingStatus(booking.id, value)}
                                  >
                                    <SelectTrigger className="w-[140px] bg-white">
                                      <SelectValue placeholder="تغيير الحالة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                                      <SelectItem value="approved">موافق</SelectItem>
                                      <SelectItem value="rejected">مرفوض</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {booking.payment_screenshot_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white"
                                    onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                                  >
                                    <Eye className="w-4 h-4 ml-1" />
                                    الإيصال
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">إجمالي الحجوزات</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">إجمالي التذاكر</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} ج</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم، الهاتف، رقم الطلب، المحول منه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-gray-100"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-100">
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
              <SelectTrigger className="w-full sm:w-40 bg-gray-100">
                <SelectValue placeholder="الباكدج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الباكدجات</SelectItem>
                <SelectItem value="with-ski">مع سكي</SelectItem>
                <SelectItem value="without-ski">بدون سكي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-100">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="instapay">InstaPay</SelectItem>
                <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                <SelectItem value="orange">Orange Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-gray-100 hover:bg-gray-200" onClick={exportToCSV} title="تصدير CSV">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          {/* Approve All Button - shows when filter is not "all" */}
          {(paymentFilter !== "all" || packageFilter !== "all" || statusFilter !== "all") && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={approveAllPending}
              >
                <CheckCircle className="w-4 h-4 ml-1" />
                موافقة الكل ({filteredBookings.filter(b => b.status === "pending").length})
              </Button>
            </div>
          )}
        </div>

        {/* Bookings Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center text-gray-500">
              جاري التحميل...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center text-gray-500">
              لا توجد حجوزات
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Main Row - Compact */}
                <div className="px-3 py-2 flex flex-wrap gap-3 items-center">
                  {/* Order & Customer Info */}
                  <div className="flex-1 min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-400">{booking.order_number}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900">{booking.customer_name}</h3>
                    <p className="text-xs text-gray-500" dir="ltr">{booking.customer_phone}</p>
                  </div>

                  {/* Payment Info */}
                  <div className="min-w-[150px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">
                        {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {booking.sender_name || booking.sender_phone || "-"}
                      </span>
                      {getDuplicateCount(booking, 'sender') > 0 && (
                        <span className="inline-flex items-center px-1 rounded bg-orange-100 text-orange-600 text-[10px]">
                          <AlertTriangle className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[10px] text-gray-500">{booking.transaction_number}</span>
                      {getDuplicateCount(booking, 'transaction') > 0 && (
                        <span className="inline-flex items-center px-1 rounded bg-red-100 text-red-600 text-[10px]">
                          <AlertTriangle className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Package & Total */}
                  <div className="min-w-[80px] text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      booking.selected_package === "with-ski" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {booking.selected_package === "with-ski" ? "سكي" : "بدون"}
                    </span>
                    <p className="text-sm font-bold text-green-600">{Number(booking.total_price).toLocaleString()} ج</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {booking.status === "pending" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateBookingStatus(booking.id, "approved")}
                        >
                          <CheckCircle className="w-3 h-3 ml-1" />
                          موافقة
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateBookingStatus(booking.id, "rejected")}
                        >
                          <XCircle className="w-3 h-3 ml-1" />
                          رفض
                        </Button>
                      </>
                    ) : (
                      <Select
                        value={booking.status}
                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs bg-gray-100">
                          <SelectValue placeholder="تغيير الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="approved">موافق</SelectItem>
                          <SelectItem value="rejected">مرفوض</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {booking.payment_screenshot_url && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-gray-100 hover:bg-gray-200"
                        onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Companions - Simple inline */}
                {booking.companion_tickets > 0 && (
                  <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
                    <span className="font-medium text-gray-700">المرافقين: </span>
                    {booking.companions_details && booking.companions_details.length > 0 ? (
                      booking.companions_details.map((comp, idx) => (
                        <span key={idx}>
                          مرافق {idx + 1}: {comp.packageType === "with-ski" ? "رحلة + سكي" : "رحلة"}
                          {idx < booking.companions_details!.length - 1 && " ، "}
                        </span>
                      ))
                    ) : (
                      Array.from({ length: booking.companion_tickets }, (_, idx) => (
                        <span key={idx}>
                          مرافق {idx + 1}: غير محدد
                          {idx < booking.companion_tickets - 1 && " ، "}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
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
