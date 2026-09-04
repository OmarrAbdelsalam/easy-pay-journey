import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Search, Download, Eye, X, CreditCard, Package, Users, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Trash2, ListOrdered, Settings, ToggleLeft, ToggleRight, Calendar, Shield, Edit3, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  type: string;
  value: string;
  [key: string]: any;
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
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [trophyFilter, setTrophyFilter] = useState<string>("all");
  const [sashColorFilter, setSashColorFilter] = useState<string>("all");
  const [sashSizeFilter, setSashSizeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [warningsExpanded, setWarningsExpanded] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [homepageMode, setHomepageMode] = useState<"booking" | "waiting">("booking");
  const [savingMode, setSavingMode] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<number>(2026);

  // Trophy Edit Modal State
  const [editingTrophyBooking, setEditingTrophyBooking] = useState<Booking | null>(null);
  const [editTrophyType, setEditTrophyType] = useState<string>("");
  const [editTrophyName, setEditTrophyName] = useState<string>("");
  const [editTotalPrice, setEditTotalPrice] = useState<number>(0);
  const [isSavingTrophy, setIsSavingTrophy] = useState<boolean>(false);

  const handleOpenTrophyModal = (booking: Booking) => {
    setEditingTrophyBooking(booking);
    const trophyTypeDetail = booking.companions_details?.find((d: any) => d.type === "trophy_type")?.value || "درع نحاسي (مجاناً)";
    const trophyNameDetail = booking.companions_details?.find((d: any) => d.type === "trophy_name")?.value || booking.customer_name || "";
    setEditTrophyType(trophyTypeDetail);
    setEditTrophyName(trophyNameDetail);
    setEditTotalPrice(Number(booking.total_price) || 0);
  };

  const handleTrophyTypeChange = (newType: string) => {
    const wasCrystal = editTrophyType.includes("كريستال");
    const isNowCrystal = newType.includes("كريستال");
    if (!wasCrystal && isNowCrystal) {
      setEditTotalPrice(prev => prev + 50);
    } else if (wasCrystal && !isNowCrystal) {
      setEditTotalPrice(prev => Math.max(0, prev - 50));
    }
    setEditTrophyType(newType);
  };

  const handleSaveTrophy = async () => {
    if (!editingTrophyBooking) return;
    setIsSavingTrophy(true);
    try {
      const existingDetails = Array.isArray(editingTrophyBooking.companions_details)
        ? [...editingTrophyBooking.companions_details]
        : [];

      const typeIdx = existingDetails.findIndex((d: any) => d.type === "trophy_type");
      if (typeIdx >= 0) {
        existingDetails[typeIdx] = { ...existingDetails[typeIdx], value: editTrophyType };
      } else {
        existingDetails.push({ type: "trophy_type", value: editTrophyType });
      }

      const nameIdx = existingDetails.findIndex((d: any) => d.type === "trophy_name");
      if (nameIdx >= 0) {
        existingDetails[nameIdx] = { ...existingDetails[nameIdx], value: editTrophyName };
      } else {
        existingDetails.push({ type: "trophy_name", value: editTrophyName });
      }

      const { error } = await supabase
        .from("bookings")
        .update({ 
          companions_details: existingDetails,
          total_price: editTotalPrice
        })
        .eq("id", editingTrophyBooking.id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === editingTrophyBooking.id
            ? { ...b, companions_details: existingDetails, total_price: editTotalPrice }
            : b
        )
      );

      toast.success("تم تحديث بيانات الدرع والمبلغ بنجاح");
      setEditingTrophyBooking(null);
    } catch (error) {
      console.error("Error updating trophy:", error);
      toast.error("فشل في تحديث بيانات الدرع");
    } finally {
      setIsSavingTrophy(false);
    }
  };

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
        .update({ homepage_mode: newMode, updated_at: new Date().toISOString() })
        .eq("id", "main");

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

  const availableDates = useMemo(() => {
    const datesMap = new Map<string, string>();
    bookings.forEach((b) => {
      const d = new Date(b.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const isoKey = `${yyyy}-${mm}-${dd}`;
      if (!datesMap.has(isoKey)) {
        const formatted = d.toLocaleDateString("ar-EG", {
          weekday: "short",
          day: "numeric",
          month: "short"
        });
        datesMap.set(isoKey, formatted);
      }
    });
    return Array.from(datesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }));
  }, [bookings]);

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
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

    const matchesPayment =
      paymentFilter === "all" || booking.payment_method === paymentFilter;

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;

    const matchesDepartment = departmentFilter === "all" || 
      (booking.companions_details?.some((d: any) => d.type === "department" && d.value === departmentFilter) ?? false);

    const matchesTrophy = trophyFilter === "all" || 
      (booking.companions_details?.some((d: any) => d.type === "trophy_type" && d.value?.includes(trophyFilter)) ?? false);

    const matchesSashColor = sashColorFilter === "all" || 
      (booking.companions_details?.some((d: any) => d.type === "sash_color" && d.value?.includes(sashColorFilter)) ?? false);

    const matchesSashSize = sashSizeFilter === "all" || 
      (booking.companions_details?.some((d: any) => {
        if (d.type !== "sash_size") return false;
        const val = d.value || "";
        if (sashSizeFilter === "large") {
          return val.includes("أكبر") || val.includes("الكبير") || val.toLowerCase().includes("large");
        }
        if (sashSizeFilter === "standard") {
          return val.includes("عادي") || val.toLowerCase().includes("standard");
        }
        return false;
      }) ?? false);

    const bDate = new Date(booking.created_at);
    const bYYYYMMDD = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;

    const matchesDate = dateFilter === "all" || bYYYYMMDD === dateFilter;

    return matchesSearch && matchesPayment && matchesStatus && matchesDepartment && matchesTrophy && matchesSashColor && matchesSashSize && matchesDate;
  }), [bookings, currentBatch, searchTerm, paymentFilter, statusFilter, departmentFilter, trophyFilter, sashColorFilter, sashSizeFilter, dateFilter]);

  // Filter waiting list by batch too
  const filteredWaitingList = useMemo(() => waitingList.filter((entry) => {
    const entryBatch = (entry as any).batch || 1;
    return entryBatch === currentBatch;
  }), [waitingList, currentBatch]);

  const totalRevenue = useMemo(() => filteredBookings
    .filter(b => b.status !== "rejected")
    .reduce((sum, b) => sum + Number(b.total_price), 0), [filteredBookings]);

  const totalTickets = useMemo(() => filteredBookings
    .filter(b => b.status !== "rejected")
    .reduce((sum, b) => sum + (b.booking_type === 'tshirt' ? b.student_tickets : b.student_tickets + b.companion_tickets), 0), [filteredBookings]);

  const pendingCount = useMemo(() => filteredBookings.filter(b => b.status === "pending").length, [filteredBookings]);

  const duplicateCounts = useMemo(() => {
    const senderCounts: Record<string, number> = {};
    const transactionCounts: Record<string, number> = {};

    filteredBookings.forEach(b => {
      // transaction
      if (b.transaction_number) {
         const t = b.transaction_number.trim();
         if (t) transactionCounts[t] = (transactionCounts[t] || 0) + 1;
      }
      
      // sender
      const s = (b.sender_name || b.sender_phone || "").trim();
      if (s) {
        senderCounts[s] = (senderCounts[s] || 0) + 1;
      }
    });

    return { senderCounts, transactionCounts };
  }, [filteredBookings]);

  const getDuplicateCount = (booking: Booking, field: 'sender' | 'transaction') => {
    if (field === 'sender') {
      const s = (booking.sender_name || booking.sender_phone || "").trim();
      if (!s) return 0;
      return Math.max(0, (duplicateCounts.senderCounts[s] || 0) - 1);
    } else {
      const t = (booking.transaction_number || "").trim();
      if (!t) return 0;
      return Math.max(0, (duplicateCounts.transactionCounts[t] || 0) - 1);
    }
  };

  const sashColorStats = useMemo(() => {
    const stats: Record<string, { choice1: number; choice2: number; choice3: number; totalPoints: number; colorHex: string }> = {
      "أبيض": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#FFFFFF" },
      "نبيتي": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#7A0C2E" },
      "أسود": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#18181B" },
      "بترولي": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#00729A" },
      "ازرق": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#1D4ED8" },
      "بيج": { choice1: 0, choice2: 0, choice3: 0, totalPoints: 0, colorHex: "#F5E6D3" },
    };

    filteredBookings.forEach((booking) => {
      const sashDetail = booking.companions_details?.find((d: any) => d.type === "sash_color")?.value;
      if (!sashDetail) return;
      
      const colors = sashDetail.split(/\s*-\s*|\s*,\s*/).map((c: string) => c.trim());
      
      if (colors[0] && stats[colors[0]]) {
        stats[colors[0]].choice1 += 1;
        stats[colors[0]].totalPoints += 3;
      }
      if (colors[1] && stats[colors[1]]) {
        stats[colors[1]].choice2 += 1;
        stats[colors[1]].totalPoints += 2;
      }
      if (colors[2] && stats[colors[2]]) {
        stats[colors[2]].choice3 += 1;
        stats[colors[2]].totalPoints += 1;
      }
    });

    const totalVoters = filteredBookings.filter(b => b.companions_details?.some((d: any) => d.type === "sash_color")).length;

    const list = Object.entries(stats).map(([colorName, data]) => ({
      colorName,
      ...data,
      percentage: totalVoters > 0 ? Math.round((data.choice1 / totalVoters) * 100) : 0,
    })).sort((a, b) => {
      if (b.choice1 !== a.choice1) return b.choice1 - a.choice1;
      return b.totalPoints - a.totalPoints;
    });

    return { list, totalVoters, winner: list[0] };
  }, [filteredBookings]);

  const paymentMethodLabels: Record<string, string> = {
    instapay: "InstaPay",
    vodafone: "Vodafone",
    orange: "Orange"
  };

  const exportToCSV = () => {
    const headers = [
      "م",
      "رقم الطلب",
      "اسم الخريج",
      "رقم الموبايل",
      "القسم",
      "ألوان الوشاح",
      "مقاس الوشاح",
      "الاسم على الوشاح",
      "نوع الدرع",
      "الاسم على الدرع",
      "المرافقين الإضافيين",
      "إجمالي عدد الحضور",
      "المبلغ الإجمالي (ج.م)",
      "وسيلة الدفع",
      "رقم المعاملة",
      "المحول منه",
      "هل تم دفع الفلوس؟ (حالة الدفع)",
      "حالة الطلب",
      "تاريخ ووقت الحجز"
    ];

    // Sort by seniority (oldest first: created_at ASC)
    const sortedBookings = [...filteredBookings].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const rows = sortedBookings.map((b, index) => {
      const details = Array.isArray(b.companions_details) ? b.companions_details : [];
      const department = details.find((d: any) => d.type === "department")?.value || "-";
      const sashColor = details.find((d: any) => d.type === "sash_color")?.value || "-";
      const sashSize = details.find((d: any) => d.type === "sash_size")?.value || "-";
      const sashName = details.find((d: any) => d.type === "sash_name")?.value || "-";
      const trophyType = details.find((d: any) => d.type === "trophy_type")?.value || "-";
      const trophyName = details.find((d: any) => d.type === "trophy_name")?.value || "-";
      const extraCompanions = Number(details.find((d: any) => d.type === "extra_companions_count")?.value) || (b.companion_tickets > 2 ? b.companion_tickets - 2 : 0);
      const totalAttendees = 1 + 2 + extraCompanions;

      const paymentStatus = b.status === "approved"
        ? "تم الدفع وتأكيد الحجز"
        : b.status === "rejected"
        ? "مرفوض"
        : "قيد المراجعة (لم يتم التأكيد)";

      const orderStatus = b.status === "approved" ? "موافق" : b.status === "rejected" ? "مرفوض" : "قيد الانتظار";

      const createdAtFormatted = new Date(b.created_at).toLocaleString("ar-EG", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      return [
        index + 1,
        `"${b.order_number}"`,
        `"${(b.customer_name || "").replace(/"/g, '""')}"`,
        `"\t${b.customer_phone || ""}"`,
        `"${department.replace(/"/g, '""')}"`,
        `"${sashColor.replace(/"/g, '""')}"`,
        `"${sashSize.replace(/"/g, '""')}"`,
        `"${sashName.replace(/"/g, '""')}"`,
        `"${trophyType.replace(/"/g, '""')}"`,
        `"${trophyName.replace(/"/g, '""')}"`,
        extraCompanions,
        totalAttendees,
        b.total_price,
        `"${paymentMethodLabels[b.payment_method] || b.payment_method}"`,
        `"\t${b.transaction_number || ""}"`,
        `"${(b.sender_name || b.sender_phone || "-").replace(/"/g, '""')}"`,
        `"${paymentStatus}"`,
        `"${orderStatus}"`,
        `"${createdAtFormatted}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `graduates_fci_2026_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير شيت الطلاب مرتبين بالأقدمية بنجاح");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg" dir="rtl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
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
                className="text-center bg-gray-50 border-gray-200 text-gray-900"
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8" dir="rtl">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-sm text-gray-500">إدارة حجوزات حفلة التخرج 2026</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`border-gray-200 ${showWaitingList ? 'bg-blue-600 text-gray-900 hover:bg-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              onClick={toggleWaitingList}
            >
              <ListOrdered className="w-4 h-4 ml-1" />
              قائمة الانتظار
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={savingMode}
              className={`border-gray-200 ${homepageMode === "waiting" ? 'bg-amber-600 text-gray-900 hover:bg-amber-700' : 'bg-green-600 text-gray-900 hover:bg-green-700'}`}
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
            <a href="/my-booking" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
                <Search className="w-4 h-4 ml-1" />
                صفحة الاستعلام
              </Button>
            </a>
            <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-100" onClick={handleLogout}>
              تسجيل خروج
            </Button>
          </div>
        </div>



        {/* Waiting List Section */}
        {showWaitingList && (
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-blue-500/10 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-gray-900">قائمة الانتظار ({filteredWaitingList.length})</h3>
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
                <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
              ) : filteredWaitingList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">لا يوجد أحد في قائمة الانتظار</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">#</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">الاسم</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">الهاتف</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">الباكدج</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">التاريخ</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredWaitingList.map((entry, index) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{entry.name}</td>
                          <td className="px-4 py-3 text-gray-600" dir="ltr">{entry.phone}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              {entry.selected_package === "graduation_2026" ? "حفلة تخرج 2026" : entry.selected_package || "حفلة تخرج"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(entry.created_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-gray-50 text-red-400 border-red-500/20 hover:bg-red-500/10"
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
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Header - Clickable */}
                <button
                  onClick={() => setWarningsExpanded(!warningsExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-red-500/10 hover:bg-red-500/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-gray-900">حجوزات تحتاج مراجعة ({pendingWarnings})</h3>
                    {pendingWarnings !== warningBookings.length && (
                      <span className="text-xs text-gray-500">({warningBookings.length} إجمالي)</span>
                    )}
                  </div>
                  {warningsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {/* Content - Table */}
                {warningsExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">التحذير</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">العميل</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">رقم المعاملة</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">المحول منه</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">المبلغ</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {warningBookings.map((booking) => {
                          const senderDupes = getDuplicateCount(booking, 'sender');
                          const transactionDupes = getDuplicateCount(booking, 'transaction');
                          
                          return (
                            <tr key={booking.id} className="hover:bg-gray-50">
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
                                  <span className="font-mono text-[10px] text-gray-500">{booking.order_number}</span>
                                </div>
                                <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                                <div className="text-xs text-gray-500" dir="ltr">{booking.customer_phone}</div>
                              </td>
                              
                              {/* Transaction */}
                              <td className="px-3 py-2">
                                <span className="font-mono text-gray-600">{booking.transaction_number}</span>
                              </td>
                              
                              {/* Sender */}
                              <td className="px-3 py-2 text-gray-600">
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
                                      className="h-7 w-7 bg-gray-50 border-gray-200"
                                      onClick={() => setSelectedImage(booking.payment_screenshot_url)}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {booking.status === "pending" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-7 bg-green-600 hover:bg-green-700 text-gray-900 text-xs"
                                        onClick={() => updateBookingStatus(booking.id, "approved")}
                                      >
                                        موافقة
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-7 bg-red-600 hover:bg-red-700 text-gray-900 text-xs"
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
                                      <SelectTrigger className="h-7 w-[100px] text-xs bg-gray-100 border-gray-200 text-gray-600">
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
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">إجمالي الطلبات</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">إجمالي التذاكر</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">إجمالي الإيرادات</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{totalRevenue.toLocaleString()} ج</p>
          </div>
        </div>

        {/* إحصائيات تصويت الوشاح */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">إحصائيات تصويت ألوان الوشاح</h3>
            <span className="text-xs text-gray-500">إجمالي المصوتين: {sashColorStats.totalVoters} خريج</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-medium">
                <tr>
                  <th className="px-4 py-2.5">اللون</th>
                  <th className="px-4 py-2.5">الرغبة الأولى</th>
                  <th className="px-4 py-2.5">الرغبة الثانية</th>
                  <th className="px-4 py-2.5">الرغبة الثالثة</th>
                  <th className="px-4 py-2.5">نسبة الترجيح (رغبة أولى)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sashColorStats.list.map((item) => (
                  <tr key={item.colorName} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: item.colorHex }} />
                      {item.colorName}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{item.choice1}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.choice2}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.choice3}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="بحث بالاسم، الهاتف، رقم الطلب، المحول منه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-gray-50 border-gray-200 text-gray-900"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="approved">موافق</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="instapay">InstaPay</SelectItem>
                <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                <SelectItem value="orange">Orange Cash</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-28 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                <SelectItem value="CS">CS</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="IS">IS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={trophyFilter} onValueChange={setTrophyFilter}>
              <SelectTrigger className="w-full sm:w-28 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="الدرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدروع</SelectItem>
                <SelectItem value="نحاسي">نحاسي</SelectItem>
                <SelectItem value="كريستال">كريستال</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sashColorFilter} onValueChange={setSashColorFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="لون الوشاح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الألوان</SelectItem>
                <SelectItem value="أبيض">أبيض</SelectItem>
                <SelectItem value="نبيتي">نبيتي</SelectItem>
                <SelectItem value="أسود">أسود</SelectItem>
                <SelectItem value="بترولي">بترولي</SelectItem>
                <SelectItem value="ازرق">ازرق</SelectItem>
                <SelectItem value="بيج">بيج</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sashSizeFilter} onValueChange={setSashSizeFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="مقاس الوشاح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المقاسات</SelectItem>
                <SelectItem value="large">المقاس الكبير</SelectItem>
                <SelectItem value="standard">المقاس العادي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200 text-gray-700">
                <SelectValue placeholder="اليوم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأيام</SelectItem>
                {availableDates.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-100" onClick={exportToCSV} title="تصدير CSV">
              <Download className="w-4 h-4" />
            </Button>
          </div>
          {/* Approve All Button - shows when filter is not "all" */}
          {(paymentFilter !== "all" || statusFilter !== "all" || departmentFilter !== "all" || trophyFilter !== "all" || sashColorFilter !== "all" || sashSizeFilter !== "all" || dateFilter !== "all") && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-gray-900"
                onClick={approveAllPending}
              >
                <CheckCircle className="w-4 h-4 ml-1" />
                موافقة الكل ({filteredBookings.filter(b => b.status === "pending").length})
              </Button>
            </div>
          )}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا توجد حجوزات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">العميل</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">رقم المعاملة</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">المحول منه</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">الدفع</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">تفاصيل الطلب</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">المبلغ</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          <span className="font-mono text-[10px] text-gray-500">{booking.order_number}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-medium">
                            تخرج
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                        <div className="text-xs text-gray-500" dir="ltr">{booking.customer_phone}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {new Date(booking.created_at).toLocaleDateString("ar-EG")} • {new Date(booking.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        {booking.customer_national_id && (
                          <div className="text-xs text-purple-500 font-medium truncate max-w-[200px]">{booking.customer_national_id}</div>
                        )}
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
                          <span className="text-gray-600">{booking.sender_name || booking.sender_phone || "-"}</span>
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
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
                          {paymentMethodLabels[booking.payment_method] || booking.payment_method}
                        </span>
                      </td>
                      
                      {/* تفاصيل التخرج */}
                      <td className="px-4 py-3">
                        {Array.isArray(booking.companions_details) && booking.companions_details.length > 0 ? (
                          <div className="text-xs text-gray-600 space-y-1">
                            {(() => {
                              const details = booking.companions_details as any[];
                              const department = details.find((d: any) => d.type === 'department')?.value;
                              const sashColor = details.find((d: any) => d.type === 'sash_color')?.value;
                              const sashSize = details.find((d: any) => d.type === 'sash_size')?.value;
                              const sashName = details.find((d: any) => d.type === 'sash_name')?.value;
                              const trophyType = details.find((d: any) => d.type === 'trophy_type')?.value;
                              const trophyName = details.find((d: any) => d.type === 'trophy_name')?.value;
                              const extraCompanions = details.find((d: any) => d.type === 'extra_companions_count')?.value;
                              return (
                                <>
                                  {department && <div><strong>القسم:</strong> {department}</div>}
                                  {sashColor && <div><strong>الوشاح:</strong> {sashColor} {sashSize ? `(${sashSize})` : ''}</div>}
                                  {sashName && <div className="text-purple-600 font-semibold"><strong>اسم الوشاح:</strong> {sashName}</div>}
                                  {trophyType && (
                                    <div className="flex items-center gap-1">
                                      <span><strong>الدرع:</strong> {trophyType}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenTrophyModal(booking)}
                                        className="text-amber-600 hover:text-amber-700 p-0.5 rounded hover:bg-amber-50"
                                        title="تعديل بيانات الدرع"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 inline ml-0.5" />
                                      </button>
                                    </div>
                                  )}
                                  {trophyName && <div className="text-amber-600 font-semibold"><strong>اسم الدرع:</strong> {trophyName}</div>}
                                  {extraCompanions && Number(extraCompanions) > 0 && (
                                    <div><strong>مرافقين إضافيين:</strong> {extraCompanions}</div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : booking.companion_tickets > 0 ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                            {booking.companion_tickets} مرافق
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
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
                                className="h-8 bg-green-600 hover:bg-green-700 text-gray-900"
                                onClick={() => updateBookingStatus(booking.id, "approved")}
                              >
                                <CheckCircle className="w-4 h-4 ml-1" />
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 bg-red-600 hover:bg-red-700 text-gray-900"
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
                              <SelectTrigger className="h-8 w-[120px] bg-gray-100 border-gray-200 text-gray-600">
                                <SelectValue placeholder="تغيير الحالة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                <SelectItem value="approved">موافق</SelectItem>
                                <SelectItem value="rejected">مرفوض</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                            onClick={() => handleOpenTrophyModal(booking)}
                            title="تعديل بيانات الدرع"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-gray-50 text-red-400 border-red-500/20 hover:bg-red-500/10"
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
                                  className="bg-red-600 hover:bg-red-700 text-gray-900"
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

      {/* Trophy Edit Modal */}
      <Dialog open={!!editingTrophyBooking} onOpenChange={(open) => !open && setEditingTrophyBooking(null)}>
        <DialogContent className="bg-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              تعديل بيانات الدرع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-right">
            <div>
              <p className="text-xs text-gray-500 mb-1">العميل:</p>
              <p className="font-bold text-gray-900">{editingTrophyBooking?.customer_name}</p>
              <p className="text-xs text-gray-500 font-mono">{editingTrophyBooking?.order_number}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">نوع الدرع</Label>
              <Select value={editTrophyType} onValueChange={handleTrophyTypeChange}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="اختر نوع الدرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="درع نحاسي (مجاناً)">درع نحاسي (مجاناً)</SelectItem>
                  <SelectItem value="درع كريستال (+50ج)">درع كريستال (+50ج)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">الاسم المطلوب على الدرع</Label>
              <Input
                value={editTrophyName}
                onChange={(e) => setEditTrophyName(e.target.value)}
                placeholder="اسم الخريج المكتوب على الدرع"
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">المبلغ الإجمالي (ج.م)</Label>
                {editTrophyType.includes("كريستال") && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    +50 ج فرق درع كريستال
                  </span>
                )}
              </div>
              <Input
                type="number"
                value={editTotalPrice}
                onChange={(e) => setEditTotalPrice(Number(e.target.value))}
                placeholder="المبلغ الإجمالي"
                className="bg-gray-50 border-gray-200 font-bold text-gray-900"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditingTrophyBooking(null)}
              disabled={isSavingTrophy}
            >
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={handleSaveTrophy}
              disabled={isSavingTrophy}
            >
              {isSavingTrophy ? "جاري الحفظ..." : "حفظ التغيرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

