import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Search, Download, Eye, X, CreditCard, Package, Users, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Trash2, ListOrdered, Settings, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const DASHBOARD_PASSWORD = "cairo2024";

interface WaitingListEntry {
  id: string;
  name: string;
  phone: string;
  selected_package: string;
  created_at: string;
}

interface CompanionDetail {
  index: number;
  type: string;
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
  booking_type: string;
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
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [warningsExpanded, setWarningsExpanded] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [homepageMode, setHomepageMode] = useState<"booking" | "waiting">("booking");
  const [savingMode, setSavingMode] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<number>(3); // إفطار رمضان 2026

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
      fetchHomepageMode();
    }
  }, [isAuthenticated]);

  // Real-time subscription for bookings
  useEffect(() => {
    if (!isAuthenticated) return;

    const bookingsChannel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const newBooking = {
            ...payload.new,
            companions_details: Array.isArray(payload.new.companions_details) 
              ? (payload.new.companions_details as unknown as CompanionDetail[]) 
              : []
          } as Booking;
          setBookings(prev => [newBooking, ...prev]);
          toast.success(`حجز جديد من ${newBooking.customer_name}`, { duration: 5000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          const updatedBooking = {
            ...payload.new,
            companions_details: Array.isArray(payload.new.companions_details) 
              ? (payload.new.companions_details as unknown as CompanionDetail[]) 
              : []
          } as Booking;
          setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, [isAuthenticated]);

  // Real-time subscription for waiting_list
  useEffect(() => {
    if (!isAuthenticated) return;

    const waitingListChannel = supabase
      .channel('waiting-list-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waiting_list' },
        (payload) => {
          const newEntry = payload.new as WaitingListEntry;
          setWaitingList(prev => [newEntry, ...prev]);
          toast.info(`تسجيل جديد في قائمة الانتظار: ${newEntry.name}`, { duration: 5000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'waiting_list' },
        (payload) => {
          setWaitingList(prev => prev.filter(w => w.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(waitingListChannel);
    };
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
      
      // Preload all payment screenshots
      bookingsData.forEach(booking => {
        if (booking.payment_screenshot_url) {
          const img = new Image();
          img.src = booking.payment_screenshot_url;
        }
      });
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

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;

      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success("تم حذف الحجز بنجاح");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("فشل في حذف الحجز");
    }
  };

  const fetchWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const { data, error } = await supabase
        .from("waiting_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWaitingList(data || []);
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      toast.error("فشل في تحميل قائمة الانتظار");
    } finally {
      setWaitingListLoading(false);
    }
  };

  const deleteWaitingListEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("waiting_list")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWaitingList(prev => prev.filter(w => w.id !== id));
      toast.success("تم الحذف بنجاح");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("فشل في الحذف");
    }
  };

  const toggleWaitingList = () => {
    if (!showWaitingList && waitingList.length === 0) {
      fetchWaitingList();
    }
    setShowWaitingList(!showWaitingList);
  };

  const fetchHomepageMode = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("homepage_mode")
        .eq("id", "main")
        .single();

      if (error) throw error;
      if (data) {
        setHomepageMode(data.homepage_mode as "booking" | "waiting");
      }
    } catch (error) {
      console.error("Error fetching homepage mode:", error);
    }
  };

  const toggleHomepageMode = async () => {
    const newMode = homepageMode === "booking" ? "waiting" : "booking";
    setSavingMode(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: "main", homepage_mode: newMode, updated_at: new Date().toISOString() });

      if (error) throw error;
      
      setHomepageMode(newMode);
      toast.success(newMode === "booking" ? "الصفحة الرئيسية: الحجز" : "الصفحة الرئيسية: قائمة الانتظار");
    } catch (error) {
      console.error("Error updating homepage mode:", error);
      toast.error("فشل في تحديث الإعدادات");
    } finally {
      setSavingMode(false);
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
    // Filter by batch first
    const bookingBatch = (booking as any).batch || 1;
    if (bookingBatch !== currentBatch) return false;

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

    const matchesYear =
      yearFilter === "all" || 
      (yearFilter === "خريج" ? (booking.booking_type === "grad" || !booking.customer_year) : booking.customer_year === yearFilter);

    const matchesBookingType =
      bookingTypeFilter === "all" || booking.booking_type === bookingTypeFilter;

    return matchesSearch && matchesPackage && matchesPayment && matchesStatus && matchesYear && matchesBookingType;
  });

  // Filter waiting list by batch too
  const filteredWaitingList = waitingList.filter((entry) => {
    const entryBatch = (entry as any).batch || 1;
    return entryBatch === currentBatch;
  });

  const totalRevenue = filteredBookings
    .filter(b => b.status !== "rejected")
    .reduce((sum, b) => sum + Number(b.total_price), 0);
  const totalTickets = filteredBookings
    .filter(b => b.status !== "rejected")
    .reduce((sum, b) => sum + b.student_tickets + b.companion_tickets, 0);
  const pendingCount = filteredBookings.filter(b => b.status === "pending").length;

  const getDuplicateCount = (booking: Booking, field: 'sender' | 'transaction') => {
    if (field === 'sender') {
      const senderValue = booking.sender_name || booking.sender_phone;
      if (!senderValue) return 0;
      return filteredBookings.filter(b => 
        b.id !== booking.id && 
        ((b.sender_name && b.sender_name === booking.sender_name) || 
         (b.sender_phone && b.sender_phone === booking.sender_phone))
      ).length;
    } else {
      if (!booking.transaction_number) return 0;
      return filteredBookings.filter(b => 
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
      "إفطار",
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
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-[#111827] rounded-xl p-6 border border-white/10 shadow-lg" dir="rtl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
              <p className="text-sm text-gray-400">أدخل كلمة المرور للدخول</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center bg-white/5 border-white/10 text-white"
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
    <div className="min-h-screen bg-[#0a0e1a] py-4 sm:py-8" dir="rtl">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-sm text-gray-400">إدارة حجوزات إفطار حاسبات طنطا - رمضان 2026</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`border-white/10 ${showWaitingList ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              onClick={toggleWaitingList}
            >
              <ListOrdered className="w-4 h-4 ml-1" />
              قائمة الانتظار
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={savingMode}
              className={`border-white/10 ${homepageMode === "waiting" ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
              onClick={toggleHomepageMode}
            >
              {homepageMode === "booking" ? (
                <>
                  <ToggleLeft className="w-4 h-4 ml-1" />
                  الحجز مفتوح
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 ml-1" />
                  قائمة انتظار
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" onClick={handleLogout}>
              تسجيل خروج
            </Button>
          </div>
        </div>



        {/* Waiting List Section */}
        {showWaitingList && (
          <div className="mb-6">
            <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-blue-500/10 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white">قائمة الانتظار ({filteredWaitingList.length})</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWaitingList(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {waitingListLoading ? (
                <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
              ) : filteredWaitingList.length === 0 ? (
                <div className="p-8 text-center text-gray-400">لا يوجد أحد في قائمة الانتظار</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">#</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">الاسم</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">الهاتف</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">الباكدج</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">التاريخ</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-400">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredWaitingList.map((entry, index) => (
                        <tr key={entry.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-white">{entry.name}</td>
                          <td className="px-4 py-3 text-gray-300" dir="ltr">{entry.phone}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                              إفطار
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(entry.created_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-white/5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => deleteWaitingListEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Duplicates Warning Section - Collapsible */}
        {(() => {
          const warningBookings = filteredBookings
            .filter(b => getDuplicateCount(b, 'sender') > 0 || getDuplicateCount(b, 'transaction') > 0)
            .sort((a, b) => {
              // Pending first, then approved, then rejected
              const order = { pending: 0, approved: 1, rejected: 2 };
              return (order[a.status as keyof typeof order] || 0) - (order[b.status as keyof typeof order] || 0);
            });
          
          const pendingWarnings = warningBookings.filter(b => b.status === "pending").length;
          
          if (warningBookings.length === 0) return null;
          
          return (
            <div className="mb-6">
              <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                {/* Header - Clickable */}
                <button
                  onClick={() => setWarningsExpanded(!warningsExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-red-500/10 hover:bg-red-500/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-white">⚠️ حجوزات تحتاج مراجعة ({pendingWarnings})</h3>
                    {pendingWarnings !== warningBookings.length && (
                      <span className="text-xs text-gray-400">({warningBookings.length} إجمالي)</span>
                    )}
                  </div>
                  {warningsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {/* Content - Table */}
                {warningsExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-3 py-2 text-right font-medium text-gray-400">التحذير</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-400">العميل</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-400">رقم المعاملة</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-400">المحول منه</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-400">المبلغ</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-400">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {warningBookings.map((booking) => {
                          const senderDupes = getDuplicateCount(booking, 'sender');
                          const transactionDupes = getDuplicateCount(booking, 'transaction');
                          
                          return (
                            <tr key={booking.id} className="hover:bg-white/5">
                              {/* Warning Tags */}
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  {transactionDupes > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium">
                                      <AlertTriangle className="w-3 h-3" />
                                      معاملة مكررة ({transactionDupes})
                                    </span>
                                  )}
                                  {senderDupes > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-medium">
                                      <AlertTriangle className="w-3 h-3" />
                                      محول مكرر ({senderDupes})
                                    </span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Customer */}
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(booking.status)}
                                  <span className="font-mono text-[10px] text-gray-400">{booking.order_number}</span>
                                </div>
                                <div className="font-semibold text-white">{booking.customer_name}</div>
                                <div className="text-xs text-gray-400" dir="ltr">{booking.customer_phone}</div>
                              </td>
                              
                              {/* Transaction */}
                              <td className="px-3 py-2">
                                <span className="font-mono text-gray-300">{booking.transaction_number}</span>
                              </td>
                              
                              {/* Sender */}
                              <td className="px-3 py-2 text-gray-300">
                                {booking.sender_name || booking.sender_phone || "-"}
                              </td>
                              
                              {/* Price */}
                              <td className="px-3 py-2">
                                <span className="font-bold text-green-400">{Number(booking.total_price).toLocaleString()} ج</span>
                              </td>
                              
                              {/* Actions */}
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  {booking.payment_screenshot_url && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 bg-white/5 border-white/10"
                                      onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {booking.status === "pending" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs"
                                        onClick={() => updateBookingStatus(booking.id, "approved")}
                                      >
                                        موافقة
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs"
                                        onClick={() => updateBookingStatus(booking.id, "rejected")}
                                      >
                                        رفض
                                      </Button>
                                    </>
                                  ) : (
                                    <Select
                                      value={booking.status}
                                      onValueChange={(value) => updateBookingStatus(booking.id, value)}
                                    >
                                      <SelectTrigger className="h-7 w-[100px] text-xs bg-white/10 border-white/10 text-gray-300">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">انتظار</SelectItem>
                                        <SelectItem value="approved">موافق</SelectItem>
                                        <SelectItem value="rejected">مرفوض</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">إجمالي الحجوزات</span>
            </div>
            <p className="text-2xl font-bold text-white">{filteredBookings.length}</p>
          </div>
          <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">إجمالي التذاكر</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalTickets}</p>
          </div>
          <div className="bg-[#111827] rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString()} ج</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم، الهاتف، رقم الطلب، المحول منه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-gray-300">
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
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-gray-300">
                <SelectValue placeholder="الباكدج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الباكدجات</SelectItem>
                <SelectItem value="with-ski">مع سكي</SelectItem>
                <SelectItem value="without-ski">بدون سكي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-gray-300">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="instapay">InstaPay</SelectItem>
                <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                <SelectItem value="orange">Orange Cash</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-gray-300">
                <SelectValue placeholder="السنة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل السنين</SelectItem>
                <SelectItem value="أولى">أولى</SelectItem>
                <SelectItem value="تانية">تانية</SelectItem>
                <SelectItem value="تالتة">تالتة</SelectItem>
                <SelectItem value="رابعة">رابعة</SelectItem>
                <SelectItem value="خريج">خريج/معيد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bookingTypeFilter} onValueChange={setBookingTypeFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-white/5 border-white/10 text-gray-300">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="student">طالب</SelectItem>
                <SelectItem value="grad">خريج/معيد</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" onClick={exportToCSV} title="تصدير CSV">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          {/* Approve All Button - shows when filter is not "all" */}
          {(paymentFilter !== "all" || packageFilter !== "all" || statusFilter !== "all" || yearFilter !== "all") && (
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

        {/* Bookings Table */}
        <div className="bg-[#111827] rounded-xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">لا توجد حجوزات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">العميل</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">رقم المعاملة</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">المحول منه</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">الدفع</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">النوع</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">المرافقين</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">المبلغ</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/5">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          <span className="font-mono text-[10px] text-gray-400">{booking.order_number}</span>
                          {booking.booking_type === 'grad' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-medium">
                              خريج
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-white">{booking.customer_name}</div>
                        <div className="text-xs text-gray-400" dir="ltr">{booking.customer_phone}</div>
                        {booking.booking_type !== 'grad' && booking.customer_year && (
                          <div className="text-xs text-gray-500">{booking.customer_year}</div>
                        )}
                        <div className="text-[10px] text-gray-500 font-mono">{booking.customer_national_id}</div>
                      </td>
                      
                      {/* Transaction Number */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-gray-700">{booking.transaction_number}</span>
                          {getDuplicateCount(booking, 'transaction') > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-red-100 text-red-600 text-[10px]">
                              <AlertTriangle className="w-3 h-3" />
                              {getDuplicateCount(booking, 'transaction')}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Sender */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-300">{booking.sender_name || booking.sender_phone || "-"}</span>
                          {getDuplicateCount(booking, 'sender') > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px]">
                              <AlertTriangle className="w-3 h-3" />
                              {getDuplicateCount(booking, 'sender')}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Payment Method */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded bg-white/10 text-gray-300 text-xs">
                          {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                        </span>
                      </td>
                      
                      {/* Package */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          إفطار
                        </span>
                      </td>
                      
                      {/* Companions */}
                      <td className="px-4 py-3">
                        {booking.companion_tickets > 0 ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                            {booking.companion_tickets} مرافق
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      
                      {/* Price */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-green-600">{Number(booking.total_price).toLocaleString()} ج</span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {booking.payment_screenshot_url && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-gray-100 hover:bg-gray-200"
                              onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {booking.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => updateBookingStatus(booking.id, "approved")}
                              >
                                <CheckCircle className="w-4 h-4 ml-1" />
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 bg-red-600 hover:bg-red-700 text-white"
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
                              <SelectTrigger className="h-8 w-[120px] bg-white/10 border-white/10 text-gray-300">
                                <SelectValue placeholder="تغيير الحالة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                <SelectItem value="approved">موافق</SelectItem>
                                <SelectItem value="rejected">مرفوض</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-white/5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl" className="bg-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف حجز {booking.customer_name}؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex gap-2">
                                <AlertDialogCancel className="bg-white">إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => deleteBooking(booking.id)}
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
