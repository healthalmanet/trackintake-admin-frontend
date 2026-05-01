import { useState, useMemo, useEffect } from "react";
import {
  UserPlus, CreditCard, UserCheck, Clock3, Bell,
  CheckCheck, Search, ChevronDown, X, Trash2, SlidersHorizontal, Loader2
} from "lucide-react";
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications";

const MOCK_DATA = [
  { id: 1, title: "New User Registration", message: "Aarav Sharma registered a new account.", type: "Registration", notif_type: "USER", user_id: 101, is_read: false, created_at: "2026-04-07T09:30:00Z" },
  { id: 2, title: "Plan Purchased", message: "Priya Mehta purchased Hero Plan (ID: PAY-002).", type: "Plan Purchase", notif_type: "USER", user_id: 102, is_read: false, created_at: "2026-04-07T08:15:00Z" },
  { id: 3, title: "Nutritionist Assigned", message: "Dr. Kavya Reddy assigned to Rohan Verma for weight management.", type: "Assignment", notif_type: "ADMIN", user_id: 103, is_read: false, created_at: "2026-04-07T06:00:00Z" },
  { id: 4, title: "Plan Expiry Alert", message: "Sneha Patil's Silver Plan expires in 3 days.", type: "Expiry", notif_type: "ADMIN", user_id: 104, is_read: false, created_at: "2026-04-06T14:30:00Z" },
  { id: 5, title: "New User Registration", message: "Karan Joshi registered a new account.", type: "Registration", notif_type: "USER", user_id: 105, is_read: true, created_at: "2026-04-06T10:00:00Z" },
  { id: 6, title: "Plan Purchased", message: "Ananya Singh purchased Basic Plan (ID: PAY-005).", type: "Plan Purchase", notif_type: "USER", user_id: 106, is_read: true, created_at: "2026-04-06T09:00:00Z" },
  { id: 7, title: "Nutritionist Assigned", message: "Dr. Rahul Desai assigned to Vikram Nair for sports nutrition.", type: "Assignment", notif_type: "ADMIN", user_id: 107, is_read: true, created_at: "2026-04-05T16:00:00Z" },
  { id: 8, title: "Plan Purchased", message: "System Auto-Pay: Monthly recurring charge processed successfully.", type: "Plan Purchase", notif_type: "ADMIN", user_id: null, is_read: true, created_at: "2026-04-05T09:00:00Z" },
  { id: 9, title: "Plan Expiry Alert", message: "Mehul Shah's Hero Plan expires in 5 days.", type: "Expiry", notif_type: "ADMIN", user_id: 109, is_read: true, created_at: "2026-04-04T08:45:00Z" },
  { id: 10, title: "New User Registration", message: "Pooja Iyer registered a new account.", type: "Registration", notif_type: "USER", user_id: 110, is_read: true, created_at: "2026-04-03T11:00:00Z" },
  { id: 11, title: "Nutritionist Assigned", message: "Dr. Sneha Iyer assigned to Arjun Kapoor for diabetes care.", type: "Assignment", notif_type: "ADMIN", user_id: 111, is_read: true, created_at: "2026-04-02T15:30:00Z" },
  { id: 12, title: "New User Registration", message: "Neha Gupta registered a new account.", type: "Registration", notif_type: "USER", user_id: 112, is_read: true, created_at: "2026-04-01T09:00:00Z" },
];

const TYPE_CONFIG = {
  "Registration": { icon: UserPlus, bg: "bg-orange-50", color: "text-orange-500", badge: "bg-orange-50 text-orange-600 border-orange-100" },
  "Plan Purchase": { icon: CreditCard, bg: "bg-blue-50", color: "text-blue-500", badge: "bg-blue-50 text-blue-600 border-blue-100" },
  "Assignment": { icon: UserCheck, bg: "bg-purple-50", color: "text-purple-500", badge: "bg-purple-50 text-purple-600 border-purple-100" },
  "Expiry": { icon: Clock3, bg: "bg-red-50", color: "text-red-500", badge: "bg-red-50 text-red-600 border-red-100" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function groupByDate(list) {
  const groups = {};
  list.forEach((n) => {
    const d = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString())
      label = `TODAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    else if (d.toDateString() === yesterday.toDateString())
      label = `YESTERDAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    else
      label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

function NotificationCard({ n, onMarkRead }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG["Registration"];
  const Icon = cfg.icon;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 px-5 py-4 transition-all hover:shadow-md ${!n.is_read ? "border-l-4 border-l-orange-500" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon size={18} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm">{n.title}</span>
          {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${n.notif_type === "ADMIN" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
            {n.notif_type}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock3 size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
          </div>
          {n.user_id && <span className="text-xs text-gray-400">User #{n.user_id}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {n.message?.toLowerCase().includes("please assign a nutritionist") && (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("app-nav", {
                detail: {
                  page: "nutritionists",
                  state: { user_id: n.user_id }
                }
              }));
            }}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-orange-500 text-white border-orange-500 hover:bg-orange-600 cursor-pointer transition"
          >
            Assign Nutritionist
          </button>
        )}
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wide ${cfg.badge}`}>{n.type}</span>
        <button onClick={() => !n.is_read && onMarkRead(n.id)} title={n.is_read ? "Read" : "Mark as read"}
          className={`transition cursor-pointer ${n.is_read ? "text-orange-400" : "text-gray-300 hover:text-orange-400"}`}>
          <CheckCheck size={18} />
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

  useEffect(() => {
    getAdminNotifications()
      .then((data) => {
        const list = data.notifications || [];
        setNotifications(list);
        if (onUnreadChange) onUnreadChange(list.filter((n) => !n.is_read).length);
      })
      .catch((error) => {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        if (onUnreadChange) onUnreadChange(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const update = (updated) => {
    setNotifications(updated);
    if (onUnreadChange) onUnreadChange(updated.filter((n) => !n.is_read).length);
  };

  const handleMarkRead = async (id) => {
    try { await markNotificationRead(id); } catch (e) { console.error(e); }
    update(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    try { await markAllNotificationsRead("admin"); } catch (e) { console.error(e); }
    update(notifications.map((n) => ({ ...n, is_read: true })));
  };
  const handleClearAll = () => update([]);

  const hasFilters = search || typeFilter !== "All Types" || statusFilter !== "All" || dateFilter;

  const filtered = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter((n) => {
        const q = search.toLowerCase();
        const matchSearch = !search || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || String(n.user_id || "").includes(q);
        const matchType = typeFilter === "All Types" || n.type === typeFilter;
        const matchStatus = statusFilter === "All" || (statusFilter === "Unread" ? !n.is_read : n.is_read);
        const matchDate = !dateFilter || n.created_at.startsWith(dateFilter);
        return matchSearch && matchType && matchStatus && matchDate;
      });
  }, [notifications, search, typeFilter, statusFilter, dateFilter]);

  const grouped = groupByDate(filtered);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 size={32} className="text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <Bell size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer shadow-sm">
                  <CheckCheck size={15} /> Mark All Read
                </button>
              )}
              <button onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-gray-600 text-sm font-semibold rounded-xl transition cursor-pointer shadow-sm">
                <Trash2 size={15} /> Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by title, message or user ID..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition" />
            </div>
            {[
              { value: typeFilter, set: setTypeFilter, options: ["All Types", "Registration", "Plan Purchase", "Assignment", "Expiry"] },
              { value: statusFilter, set: setStatusFilter, options: ["All", "Unread", "Read"] },
            ].map(({ value, set, options }, i) => (
              <div key={i} className="relative">
                <select value={value} onChange={(e) => set(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700 font-medium">
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ))}
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="py-2.5 px-3 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700" />
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <SlidersHorizontal size={14} />
            </button>
            {hasFilters && (
              <button onClick={() => { setSearch(""); setTypeFilter("All Types"); setStatusFilter("All"); setDateFilter(""); }}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
              <Bell size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No notifications found.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([label, items]) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-bold text-gray-400 tracking-widest px-1">{label}</p>
                {items.map((n) => <NotificationCard key={n.id} n={n} onMarkRead={handleMarkRead} />)}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
