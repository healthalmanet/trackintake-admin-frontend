import { useState, useMemo, useEffect } from "react";
import {
  UserPlus, CreditCard, UserCheck, Clock3, Bell,
  CheckCheck, Search, ChevronDown, X, Trash2, SlidersHorizontal, Loader2,
  AlertTriangle, CalendarCheck, CalendarX, AlertCircle, Sparkles, Send, ExternalLink
} from "lucide-react";
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead, triggerNotificationEvent } from "../api/notifications";

const TYPE_CONFIG = {
  "Registration": {
    icon: UserPlus,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    actionLabel: "Review Profile",
    actionPage: "approvals",
  },
  "Plan Purchase": {
    icon: CreditCard,
    bg: "bg-blue-50",
    color: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    actionLabel: "View Payment",
    actionPage: "payments",
  },
  "Payment Failed": {
    icon: AlertTriangle,
    bg: "bg-rose-50",
    color: "text-rose-600",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    actionLabel: "Check Payment",
    actionPage: "payments",
  },
  "Appointment": {
    icon: CalendarCheck,
    bg: "bg-sky-50",
    color: "text-sky-600",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    actionLabel: "View Booking",
    actionPage: "appointments",
  },
  "Appointment Cancelled": {
    icon: CalendarX,
    bg: "bg-amber-50",
    color: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    actionLabel: "View Booking",
    actionPage: "appointments",
  },
  "Appointment Failed": {
    icon: AlertCircle,
    bg: "bg-red-50",
    color: "text-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
    actionLabel: "Check Slots",
    actionPage: "appointments",
  },
  "Assignment": {
    icon: UserCheck,
    bg: "bg-purple-50",
    color: "text-purple-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    actionLabel: "View Assignment",
    actionPage: "assignments",
  },
  "Expiry": {
    icon: Clock3,
    bg: "bg-orange-50",
    color: "text-orange-600",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    actionLabel: "View Subscriptions",
    actionPage: "payments",
  },
  "General": {
    icon: Bell,
    bg: "bg-slate-50",
    color: "text-slate-600",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    actionLabel: null,
    actionPage: null,
  }
};

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function groupByDate(list) {
  const groups = {};
  list.forEach((n) => {
    const d = new Date(n.created_at || Date.now());
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString()) {
      label = `TODAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = `YESTERDAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    } else {
      label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

function NotificationCard({ n, onMarkRead }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG["General"];
  const Icon = cfg.icon;

  const handleAction = () => {
    const page = n.metadata?.page || cfg.actionPage;
    if (page) {
      window.dispatchEvent(
        new CustomEvent("app-nav", {
          detail: {
            page,
            state: n.metadata || {}
          }
        })
      );
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-start gap-4 px-5 py-4 transition-all hover:shadow-md ${!n.is_read ? "border-l-4 border-l-orange-500 bg-orange-50/15" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon size={18} className={cfg.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm leading-snug">{n.title}</span>
          {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-pulse" />}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${n.notif_type === "ADMIN" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
            {n.notif_type || "ADMIN"}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{n.message}</p>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock3 size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
          </div>
          {n.user_id && <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">User #{n.user_id}</span>}
          {n.metadata?.fee && <span className="text-xs font-bold text-emerald-600">₹{n.metadata.fee}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-center">
        {cfg.actionLabel && (
          <button
            onClick={handleAction}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 text-white hover:bg-orange-600 transition cursor-pointer shadow-2xs"
          >
            <span>{cfg.actionLabel}</span>
            <ExternalLink size={12} />
          </button>
        )}

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider ${cfg.badge}`}>
          {n.type}
        </span>

        <button
          onClick={() => !n.is_read && onMarkRead(n.id)}
          title={n.is_read ? "Already read" : "Mark as read"}
          className={`p-1.5 rounded-lg transition cursor-pointer ${n.is_read ? "text-emerald-500 bg-emerald-50" : "text-gray-300 hover:text-orange-500 hover:bg-orange-50"}`}
        >
          <CheckCheck size={17} />
        </button>
      </div>
    </div>
  );
}

export default function Notifications({ onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const fetchList = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getAdminNotifications();
      const list = data.notifications || [];
      setNotifications(list);
      if (onUnreadChange) onUnreadChange(list.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(true);

    // Sync with the centralized 1-minute global polling from App.jsx
    const onCentralUpdate = (e) => {
      const list = e.detail?.notifications;
      if (list) {
        setNotifications(list);
      }
    };
    window.addEventListener("app:notifications-updated", onCentralUpdate);

    return () => {
      window.removeEventListener("app:notifications-updated", onCentralUpdate);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const update = (updated) => {
    setNotifications(updated);
    if (onUnreadChange) onUnreadChange(updated.filter((n) => !n.is_read).length);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
    } catch (e) {
      console.error(e);
    }
    update(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    window.dispatchEvent(new CustomEvent("app:refresh-notifications"));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead("admin");
    } catch (e) {
      console.error(e);
    }
    update(notifications.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new CustomEvent("app:refresh-notifications"));
  };

  const handleClearAll = () => update([]);

  const handleSimulate = async (eventType) => {
    setSimulating(true);
    try {
      await triggerNotificationEvent(eventType);
      await fetchList(false);
      window.dispatchEvent(new CustomEvent("app:refresh-notifications"));
    } catch (err) {
      console.error("Simulate event error:", err);
    } finally {
      setSimulating(false);
      setShowSimMenu(false);
    }
  };

  const hasFilters = search || typeFilter !== "All Types" || statusFilter !== "All" || dateFilter;

  const filtered = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .filter((n) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          String(n.user_id || "").includes(q);
        const matchType = typeFilter === "All Types" || n.type === typeFilter;
        const matchStatus = statusFilter === "All" || (statusFilter === "Unread" ? !n.is_read : n.is_read);
        const matchDate = !dateFilter || (n.created_at && n.created_at.startsWith(dateFilter));
        return matchSearch && matchType && matchStatus && matchDate;
      });
  }, [notifications, search, typeFilter, statusFilter, dateFilter]);

  const grouped = groupByDate(filtered);

  return (
    <div className="p-6 space-y-6 bg-slate-50/70 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Notifications & Alerts</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              REST API Polling Active • {unreadCount} unread alerts
            </p>
          </div>
        </div>

        {/* Action Controls & Simulator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchList(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
            title="Refresh notifications"
          >
            <span>↻ Refresh</span>
          </button>

          {/* Event Simulator Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu((prev) => !prev)}
              disabled={simulating}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Sparkles size={14} className={simulating ? "animate-spin text-amber-300" : "text-amber-400"} />
              <span>Generate Test Event</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {showSimMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSimMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Simulate & Test Event Trigger
                  </div>
                  <button
                    onClick={() => handleSimulate("nutritionist_registered")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserPlus size={15} className="text-emerald-500" />
                    <div>
                      <p>🩺 Nutritionist Registered</p>
                      <span className="text-[10px] font-normal text-slate-400">Triggers review profile alert</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate("plan_purchased")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <CreditCard size={15} className="text-blue-500" />
                    <div>
                      <p>💳 Plan Purchased</p>
                      <span className="text-[10px] font-normal text-slate-400">Subscription success event</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate("payment_failed")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <AlertTriangle size={15} className="text-rose-500" />
                    <div>
                      <p>⚠️ Payment Failed</p>
                      <span className="text-[10px] font-normal text-slate-400">Transaction failure alert</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate("appointment_booked")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <CalendarCheck size={15} className="text-sky-500" />
                    <div>
                      <p>📅 Appointment Booked</p>
                      <span className="text-[10px] font-normal text-slate-400">New slot booking alert</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate("appointment_cancelled")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <CalendarX size={15} className="text-amber-500" />
                    <div>
                      <p>🚫 Appointment Cancelled</p>
                      <span className="text-[10px] font-normal text-slate-400">Patient/Doctor cancellation</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate("appointment_failed")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <AlertCircle size={15} className="text-red-500" />
                    <div>
                      <p>❌ Appointment Failed</p>
                      <span className="text-[10px] font-normal text-slate-400">Booking conflict or timeout</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by title, message or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium transition"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-slate-700 font-bold"
          >
            {[
              "All Types",
              "Registration",
              "Plan Purchase",
              "Payment Failed",
              "Appointment",
              "Appointment Cancelled",
              "Appointment Failed",
              "Assignment",
              "Expiry",
              "General"
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-slate-700 font-bold"
          >
            {["All", "Unread", "Read"].map((o) => (
              <option key={o} value={o}>
                {o === "All" ? "All Read/Unread" : o}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-300 text-slate-700 font-medium"
        />

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("All Types");
              setStatusFilter("All");
              setDateFilter("");
            }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <X size={12} /> Clear Filters
          </button>
        )}
      </div>

      {/* Notification Stream Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-16 text-center">
          <Loader2 size={32} className="text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Connecting to WebSocket feed & retrieving notifications...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Bell size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No alerts found</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time notifications triggered by patient and nutritionist events will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((n) => (
                  <NotificationCard key={n.id || `${n.created_at}_${Math.random()}`} n={n} onMarkRead={handleMarkRead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
