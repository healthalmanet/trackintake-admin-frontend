import { useState, useEffect, useCallback } from "react";
import {
  Search, Calendar, Clock, Video, Building2,
  ChevronLeft, ChevronRight, Eye, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, X, ShieldAlert,
  CreditCard, Loader2, Sparkles, Filter, ExternalLink,
  Award, Stethoscope, Play, RotateCcw, CalendarDays,
  CalendarRange, Check, AlertTriangle, ArrowUpDown
} from "lucide-react";
import * as api from "../api/appointments";

const STATUS_CONFIG = {
  CONFIRMED: { label: "Confirmed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { label: "Ongoing / Active", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  ONGOING: { label: "Ongoing", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  PENDING_REVIEW: { label: "Pending Review", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  AWAITING_PAYMENT: { label: "Awaiting Payment", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  COMPLETED: { label: "Completed", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  DECLINED: { label: "Declined", bg: "bg-slate-100 text-slate-700 border-slate-300" },
};

const PAYMENT_CONFIG = {
  PAID: { label: "Paid Online", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UNPAID: { label: "Unpaid / Clinic", bg: "bg-slate-100 text-slate-600 border-slate-200" },
  PENDING_REFUND: { label: "Refund Pending", bg: "bg-orange-50 text-orange-700 border-orange-200" },
  REFUNDED: { label: "Refunded", bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function Appointments({ pageState }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toast, setToast] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    ongoing: 0,
    upcoming: 0,
    past: 0,
    total_revenue: 0,
    inhouse: 0,
    expert: 0,
  });

  // Timeline / Time Frame Tab Filter
  const [timeFrameFilter, setTimeFrameFilter] = useState("all"); // "all", "ongoing", "upcoming", "completed", "past"

  // Standard Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => pageState?.status || "All");
  const [categoryFilter, setCategoryFilter] = useState(() => pageState?.category || "All");
  const [typeFilter, setTypeFilter] = useState(() => pageState?.type || "All");

  // Date Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState("all");

  useEffect(() => {
    if (pageState?.status) setStatusFilter(pageState.status);
    if (pageState?.category) setCategoryFilter(pageState.category);
    if (pageState?.type) setTypeFilter(pageState.type);
  }, [pageState]);

  // Selected for Management Modal
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [newMeetingLink, setNewMeetingLink] = useState("");
  const [editSlotDate, setEditSlotDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Standalone Inline Cancellation Dialog
  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [inlineReason, setInlineReason] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        search,
        status: statusFilter,
        category: categoryFilter,
        type: typeFilter,
        from_date: fromDate,
        to_date: toDate,
        time_frame: timeFrameFilter,
      };
      const data = await api.getAppointments(filters, page, 15);
      setAppointments(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || "Failed to load appointments");
      showToast(err.message || "Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, typeFilter, fromDate, toDate, timeFrameFilter, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Quick Date Range Presets
  const applyDatePreset = (presetKey) => {
    setActiveDatePreset(presetKey);
    setPage(1);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (presetKey === "all") {
      setFromDate("");
      setToDate("");
    } else if (presetKey === "today") {
      const today = toYMD(now);
      setFromDate(today);
      setToDate(today);
    } else if (presetKey === "tomorrow") {
      const tom = new Date(now);
      tom.setDate(now.getDate() + 1);
      const tomorrow = toYMD(tom);
      setFromDate(tomorrow);
      setToDate(tomorrow);
    } else if (presetKey === "thisWeek") {
      const curr = new Date(now);
      const day = curr.getDay(); // 0 = Sun
      const diffToMon = curr.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(curr.setDate(diffToMon));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      setFromDate(toYMD(mon));
      setToDate(toYMD(sun));
    } else if (presetKey === "thisMonth") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(toYMD(first));
      setToDate(toYMD(last));
    } else if (presetKey === "past30") {
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      setFromDate(toYMD(past));
      setToDate(toYMD(now));
    }
  };

  // Inline Status Change from Table Row / Card
  const handleInlineStatusChange = async (appt, newStatus) => {
    if (newStatus === "CANCELLED") {
      setCancellationTarget(appt);
      setInlineReason("");
      return;
    }

    setActionLoading(true);
    try {
      await api.updateAppointment(appt.id, { status: newStatus });
      showToast(`Appointment #${appt.id} marked as ${newStatus.replace("_", " ")}`);
      fetchAppointments();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Inline Cancellation
  const handleConfirmCancellation = async (e) => {
    e.preventDefault();
    if (!cancellationTarget) return;

    setActionLoading(true);
    try {
      await api.updateAppointment(cancellationTarget.id, {
        status: "CANCELLED",
        cancellation_reason: inlineReason || "Cancelled by administrator",
      });
      showToast(`Appointment #${cancellationTarget.id} successfully cancelled`);
      setCancellationTarget(null);
      fetchAppointments();
    } catch (err) {
      showToast(err.message || "Cancellation failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Modal Updates (Status, Meeting Link, Slot Date & Time)
  const handleSaveModalUpdates = async (newStatus) => {
    if (!selectedAppt) return;
    setActionLoading(true);
    try {
      const payload = {
        status: newStatus || selectedAppt.status,
        meeting_link: newMeetingLink,
        cancellation_reason: newStatus === "CANCELLED" ? cancellationReason : undefined,
        slot_date: editSlotDate || undefined,
        slot_start_time: editStartTime || undefined,
        slot_end_time: editEndTime || undefined,
      };

      await api.updateAppointment(selectedAppt.id, payload);
      showToast(`Consultation #${selectedAppt.id} updated successfully`);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openManageModal = (appt) => {
    setSelectedAppt(appt);
    setNewMeetingLink(appt.meeting_link || "");
    setCancellationReason(appt.cancellation_reason || "");
    setEditSlotDate(appt.slot_date || "");
    setEditStartTime(appt.slot_start_time ? appt.slot_start_time.slice(0, 5) : "");
    setEditEndTime(appt.slot_end_time ? appt.slot_end_time.slice(0, 5) : "");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-bold ${
              toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Clinical Consultations & Telehealth
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {stats.total} Total Bookings Recorded
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Appointments & Consultations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Monitor clinical sessions, telehealth meeting links, update statuses, & filter by session date
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
          Refresh
        </button>
      </div>

      {/* Executive KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[
          {
            label: "Total Bookings",
            value: stats.total,
            sub: "All sessions",
            color: "text-slate-900",
            border: "border-slate-200",
            active: timeFrameFilter === "all" && statusFilter === "All" && categoryFilter === "All" && !fromDate && !toDate,
            onClick: () => {
              setTimeFrameFilter("all");
              setStatusFilter("All");
              setCategoryFilter("All");
              setTypeFilter("All");
              setFromDate("");
              setToDate("");
              setActiveDatePreset("all");
              setPage(1);
            }
          },
          {
            label: "In-House Consults",
            value: stats.inhouse,
            sub: "Internal team slots",
            color: "text-sky-600",
            border: "border-sky-200",
            active: categoryFilter === "IN_HOUSE",
            onClick: () => { setCategoryFilter("IN_HOUSE"); setPage(1); }
          },
          {
            label: "Expert Consults",
            value: stats.expert,
            sub: "Specialist bookings",
            color: "text-purple-600",
            border: "border-purple-200",
            active: categoryFilter === "EXPERT",
            onClick: () => { setCategoryFilter("EXPERT"); setPage(1); }
          },
          {
            label: "Confirmed Active",
            value: stats.confirmed,
            sub: "Confirmed sessions",
            color: "text-emerald-600",
            border: "border-emerald-200",
            active: statusFilter === "CONFIRMED",
            onClick: () => { setStatusFilter("CONFIRMED"); setPage(1); }
          },
          {
            label: "Pending Review",
            value: stats.pending,
            sub: "Awaiting confirmation",
            color: "text-amber-600",
            border: "border-amber-200",
            active: statusFilter === "PENDING_REVIEW",
            onClick: () => { setStatusFilter("PENDING_REVIEW"); setPage(1); }
          },
          {
            label: "Consult Revenue",
            value: `₹${Number(stats.total_revenue).toLocaleString()}`,
            sub: "Verified fees",
            color: "text-orange-600",
            border: "border-orange-200",
            active: false,
            onClick: () => { setStatusFilter("All"); setCategoryFilter("All"); setPage(1); }
          },
        ].map(({ label, value, sub, color, border, active, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`bg-white rounded-2xl border ${border} p-4 shadow-xs transition hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer ${
              active ? "ring-2 ring-orange-500/20 shadow-md bg-orange-50/20" : "hover:border-slate-300"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
            <p className={`text-xl md:text-2xl font-black ${color} tracking-tight mt-1`}>{value}</p>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block truncate">{sub}</span>
          </div>
        ))}
      </div>

      {/* Down Filters: Upcoming & Past Selection */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: `All Consultations (${stats.total})`, time: "all" },
          { label: `⏳ Upcoming Consultations (${stats.upcoming})`, time: "upcoming" },
          { label: `⏪ Past Consultations (${stats.past})`, time: "past" },
        ].map((pill) => {
          const isActive = timeFrameFilter === pill.time;
          return (
            <button
              key={pill.time}
              onClick={() => {
                setTimeFrameFilter(pill.time);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter & Period Selector Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Range Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-1.5 shrink-0">
              <CalendarRange size={14} className="text-orange-500" /> Filter Date:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "tomorrow", label: "Tomorrow" },
              { id: "thisWeek", label: "This Week" },
              { id: "thisMonth", label: "This Month" },
              { id: "past30", label: "Past 30 Days" },
            ].map((p) => {
              const isSelected = activeDatePreset === p.id && ((p.id === "all" && !fromDate && !toDate) || (p.id !== "all" && (fromDate || toDate)));
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyDatePreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveDatePreset("custom");
                  setPage(1);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveDatePreset("custom");
                  setPage(1);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setActiveDatePreset("all");
                  setPage(1);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Clear date range"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Search, Timeline, Status, Mode & Category Filters */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search patient, practitioner, email, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 transition font-medium"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Filter (Upcoming / Past) */}
            <select
              value={timeFrameFilter}
              onChange={(e) => { setTimeFrameFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Timelines (Upcoming & Past)</option>
              <option value="upcoming">⏳ Upcoming Consultations ({stats.upcoming})</option>
              <option value="past">⏪ Past Consultations ({stats.past})</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">Ongoing / Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="IN_HOUSE">🏢 In-House Consultations</option>
              <option value="EXPERT">🌟 Expert Consultations</option>
            </select>

            {/* Mode Filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Modes</option>
              <option value="VIRTUAL">Virtual (Video)</option>
              <option value="IN_PERSON">In-Clinic Visit</option>
            </select>

            {/* Reset All Filters Button */}
            {(search || statusFilter !== "All" || categoryFilter !== "All" || typeFilter !== "All" || fromDate || toDate || timeFrameFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                  setTypeFilter("All");
                  setFromDate("");
                  setToDate("");
                  setTimeFrameFilter("all");
                  setActiveDatePreset("all");
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition cursor-pointer flex items-center gap-1"
                title="Clear all filters"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {(fromDate || toDate || statusFilter !== "All" || categoryFilter !== "All" || typeFilter !== "All" || search || timeFrameFilter !== "all") && (
          <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Applied:</span>
            {timeFrameFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
                Timeline: {timeFrameFilter.toUpperCase()}
                <button onClick={() => { setTimeFrameFilter("all"); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                Date: {fromDate || "Start"} to {toDate || "End"}
                <button onClick={() => { setFromDate(""); setToDate(""); setActiveDatePreset("all"); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
            {statusFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                Status: {statusFilter}
                <button onClick={() => { setStatusFilter("All"); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
            {categoryFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                Category: {categoryFilter}
                <button onClick={() => { setCategoryFilter("All"); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
            {typeFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                Mode: {typeFilter}
                <button onClick={() => { setTypeFilter("All"); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                Query: "{search}"
                <button onClick={() => { setSearch(""); setPage(1); }} className="hover:text-red-500">
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table (Desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hidden md:flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-extrabold border-b border-slate-100 tracking-wider">
              <tr>
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Patient Client</th>
                <th className="py-3.5 px-5">Assigned Clinician</th>
                <th className="py-3.5 px-5">Session Slot & Timing</th>
                <th className="py-3.5 px-5">Mode & Tier</th>
                <th className="py-3.5 px-5">Update Status</th>
                <th className="py-3.5 px-5">Fee & Payment</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <Loader2 size={28} className="animate-spin mx-auto text-orange-500 mb-2" />
                    <span className="text-xs font-semibold">Loading appointment records...</span>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400 text-xs font-medium">
                    <Calendar size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-1">Try expanding your date range or resetting search filters.</p>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const statusConf = STATUS_CONFIG[appt.status?.toUpperCase()] || {
                    label: appt.status || "Unknown",
                    bg: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  const paymentConf = PAYMENT_CONFIG[appt.payment_status?.toUpperCase()] || {
                    label: appt.payment_status || "Unpaid",
                    bg: "bg-slate-100 text-slate-600 border-slate-200",
                  };

                  return (
                    <tr key={appt.id} className="hover:bg-orange-50/20 transition group">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-slate-400">
                        #{appt.id}
                      </td>

                      {/* Patient */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {appt.patient?.name || "Patient"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{appt.patient?.email || "—"}</div>
                      </td>

                      {/* Nutritionist */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800">Dr. {appt.nutritionist?.name || "Practitioner"}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{appt.nutritionist?.email || "—"}</div>
                      </td>

                      {/* Schedule Slot & Timing Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Calendar size={13} className="text-orange-500 shrink-0" />
                          {appt.slot_date || appt.effective_date || "Date flexible"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                          <Clock size={12} className="shrink-0" />
                          {appt.slot_start_time ? `${appt.slot_start_time.slice(0, 5)} - ${appt.slot_end_time ? appt.slot_end_time.slice(0, 5) : ""}` : "Flexible time"}
                        </div>

                        {/* Timing Badge (Ongoing / Upcoming / Past) */}
                        <div className="mt-1">
                          {appt.timeline_status === "ONGOING" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                              Ongoing Today
                            </span>
                          )}
                          {appt.timeline_status === "UPCOMING" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <Clock size={10} /> Upcoming
                            </span>
                          )}
                          {appt.timeline_status === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          )}
                          {appt.timeline_status === "PAST" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                              Past Slot
                            </span>
                          )}
                          {appt.timeline_status === "CANCELLED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mode & Category */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          {appt.appointment_type?.toUpperCase() === "VIRTUAL" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Video size={11} /> Virtual
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Building2 size={11} /> In-Clinic
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mt-1 block">
                          {appt.appointment_category === "EXPERT" ? "🌟 Specialist" : "🏢 In-House"}
                        </span>
                      </td>

                      {/* Interactive Status Update Selector */}
                      <td className="py-4 px-5">
                        <div className="relative inline-block">
                          <select
                            value={appt.status?.toUpperCase() || "PENDING_REVIEW"}
                            onChange={(e) => handleInlineStatusChange(appt, e.target.value)}
                            disabled={actionLoading}
                            className={`text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl border cursor-pointer appearance-none transition focus:outline-none focus:ring-2 focus:ring-orange-400/20 ${statusConf.bg}`}
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="IN_PROGRESS">Ongoing / Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PENDING_REVIEW">Pending Review</option>
                            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                            <option value="CANCELLED">Cancel Booking</option>
                          </select>
                          <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                        </div>
                      </td>

                      {/* Fee & Payment */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900">₹{appt.fee_amount}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold border ${paymentConf.bg}`}>
                          {paymentConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => openManageModal(appt)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{appointments.length}</strong> of{" "}
            <strong className="text-slate-800">{totalCount}</strong> sessions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700 px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
            No bookings found.
          </div>
        ) : (
          appointments.map((appt) => {
            const statusConf = STATUS_CONFIG[appt.status?.toUpperCase()] || { label: appt.status || "Unknown", bg: "bg-slate-100 text-slate-600 border-slate-200" };

            return (
              <div key={appt.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">#{appt.id}</span>
                    <p className="font-bold text-slate-900 text-sm">{appt.patient?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500">Dr. {appt.nutritionist?.name || "Practitioner"}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border block ${statusConf.bg}`}>
                      {statusConf.label}
                    </span>
                    {appt.timeline_status === "ONGOING" && (
                      <span className="text-[9px] font-black text-emerald-600 block mt-1">
                        ● Ongoing Today
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Schedule</span>
                    <span className="font-semibold text-slate-800">{appt.slot_date || appt.effective_date}</span>
                    <span className="text-[10px] text-slate-400 block">{appt.slot_start_time?.slice(0, 5) || "Flexible"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee</span>
                    <span className="font-extrabold text-slate-900">₹{appt.fee_amount}</span>
                    <span className="text-[10px] text-slate-400 block">{appt.payment_status}</span>
                  </div>
                </div>

                {/* Inline Status Dropdown for Mobile */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <select
                      value={appt.status?.toUpperCase() || "PENDING_REVIEW"}
                      onChange={(e) => handleInlineStatusChange(appt, e.target.value)}
                      disabled={actionLoading}
                      className="w-full text-xs font-bold py-1.5 pl-2.5 pr-6 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="IN_PROGRESS">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING_REVIEW">Pending</option>
                      <option value="CANCELLED">Cancel</option>
                    </select>
                    <ChevronRight size={11} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => openManageModal(appt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl"
                  >
                    <Eye size={12} /> Manage
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Appointment Detail & Full Management Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[92vh] overflow-y-auto border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 to-white">
              <div>
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                  Appointment #{selectedAppt.id}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                  Consultation Management
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 text-sm">
              {/* Patient & Practitioner Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                  <p className="font-bold text-slate-900 text-base mt-1">{selectedAppt.patient?.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">{selectedAppt.patient?.email}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Practitioner</span>
                  <p className="font-bold text-slate-900 text-base mt-1">Dr. {selectedAppt.nutritionist?.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">{selectedAppt.nutritionist?.email}</p>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Session Slot</span>
                  <span className="font-bold text-slate-800">
                    {selectedAppt.slot_date || selectedAppt.effective_date} ({selectedAppt.slot_start_time?.slice(0, 5) || "Flexible"} - {selectedAppt.slot_end_time?.slice(0, 5) || ""})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mode</span>
                  <span className="font-bold text-slate-800">
                    {selectedAppt.appointment_type} ({selectedAppt.appointment_category})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Consultation Fee</span>
                  <span className="font-black text-emerald-600 text-base">₹{selectedAppt.fee_amount} ({selectedAppt.payment_status})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Current Status</span>
                  <span className="font-bold text-slate-900">{selectedAppt.status}</span>
                </div>
              </div>

              {/* Reschedule Slot Date & Time */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Reschedule Session Date & Time
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slot Date</span>
                    <input
                      type="date"
                      value={editSlotDate}
                      onChange={(e) => setEditSlotDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Start Time</span>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">End Time</span>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* Meeting Link Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Virtual Meeting Link (Google Meet / Zoom)
                </label>
                <div className="flex gap-2.5">
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz"
                    value={newMeetingLink}
                    onChange={(e) => setNewMeetingLink(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-medium"
                  />
                  {selectedAppt.meeting_link && (
                    <a
                      href={selectedAppt.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
                    >
                      Join <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Cancellation Reason (if applicable) */}
              {selectedAppt.status === "CANCELLED" ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 space-y-1.5">
                  <span className="font-bold">Cancellation Reason:</span>
                  <p>{selectedAppt.cancellation_reason || "No reason specified"}</p>
                  <span className="text-xs text-rose-500 block">Cancelled by: {selectedAppt.cancelled_by || "Admin"}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Cancellation Reason (required if cancelling)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Practitioner unavailable, Patient request"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                  />
                </div>
              )}

              {/* Admin Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                  Quick Status Update:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedAppt.status !== "CONFIRMED" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleSaveModalUpdates("CONFIRMED")}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Confirm
                    </button>
                  )}

                  {selectedAppt.status !== "IN_PROGRESS" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleSaveModalUpdates("IN_PROGRESS")}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-amber-500/20 flex items-center justify-center gap-1.5"
                    >
                      <Play size={14} /> Set Ongoing
                    </button>
                  )}

                  {selectedAppt.status !== "COMPLETED" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleSaveModalUpdates("COMPLETED")}
                      className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-600/20 flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Mark Completed
                    </button>
                  )}

                  {selectedAppt.status !== "CANCELLED" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleSaveModalUpdates("CANCELLED")}
                      className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleSaveModalUpdates()}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 size={14} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Inline Cancellation Dialog */}
      {cancellationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle size={20} />
                <h3 className="text-base font-black">
                  Cancel Booking #{cancellationTarget.id}
                </h3>
              </div>
              <button
                onClick={() => setCancellationTarget(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCancellation} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel the session between{" "}
                <strong className="text-slate-900">{cancellationTarget.patient?.name}</strong> and{" "}
                <strong className="text-slate-900">Dr. {cancellationTarget.nutritionist?.name}</strong>?
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={inlineReason}
                  onChange={(e) => setInlineReason(e.target.value)}
                  placeholder="E.g. Reschedule requested, practitioner unavailable, etc."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellationTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
