import {
  Bell, ChevronDown, LogOut, Menu,
  Shield, User, CheckCircle2, Search, ExternalLink,
  UserPlus, CreditCard, AlertTriangle, CalendarCheck, CalendarX, AlertCircle,
  CheckCheck, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { getAdminNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";

const NOTIF_ICONS = {
  "Registration": UserPlus,
  "Plan Purchase": CreditCard,
  "Payment Failed": AlertTriangle,
  "Appointment": CalendarCheck,
  "Appointment Cancelled": CalendarX,
  "Appointment Failed": AlertCircle,
};

export default function Navbar({ onLogout, unreadCount = 0, onNotificationClick, onNavigate, onToggleSidebar, activePage, notifications = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);

  // Fetch recent alerts when dropdown is toggled
  useEffect(() => {
    if (showNotificationMenu) {
      getAdminNotifications("admin")
        .then((res) => {
          if (res && res.notifications) {
            setRecentAlerts(res.notifications.slice(0, 5));
          }
        })
        .catch(() => {});
    }
  }, [showNotificationMenu]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setRecentAlerts(notifications.slice(0, 5));
    }
  }, [notifications]);

  useEffect(() => {
    const handleLiveEvent = (e) => {
      const incoming = e.detail;
      if (!incoming) return;
      if (incoming.notifications) {
        setRecentAlerts(incoming.notifications.slice(0, 5));
      } else if (incoming.id || incoming.title) {
        setRecentAlerts((prev) => [incoming, ...prev.slice(0, 4)]);
      }
    };
    window.addEventListener("app:notifications-updated", handleLiveEvent);
    window.addEventListener("trackintake:notification", handleLiveEvent);
    return () => {
      window.removeEventListener("app:notifications-updated", handleLiveEvent);
      window.removeEventListener("trackintake:notification", handleLiveEvent);
    };
  }, []);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  const initials = (user.full_name || "AD").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsRead("admin");
      setRecentAlerts((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent("app:refresh-notifications"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setRecentAlerts([]);
  };

  const handleMarkSingleRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setRecentAlerts((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      window.dispatchEvent(new CustomEvent("app:refresh-notifications"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAlertClick = (n) => {
    setShowNotificationMenu(false);
    let targetPage = "notifications";
    if (n.type === "Registration") targetPage = "approvals";
    else if (n.type === "Plan Purchase" || n.type === "Payment Failed") targetPage = "payments";
    else if (n.type?.startsWith("Appointment")) targetPage = "appointments";
    else if (n.type === "Assignment") targetPage = "assignments";

    if (onNavigate) {
      onNavigate(targetPage, n.metadata || {});
    } else if (onNotificationClick) {
      onNotificationClick();
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center px-4 md:px-6 gap-3 shadow-2xs shrink-0 z-30 sticky top-0">
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        aria-label="Toggle Navigation"
      >
        <Menu size={20} />
      </button>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className={`relative p-2 rounded-xl transition cursor-pointer shrink-0 ${
              unreadCount > 0 ? "text-orange-500 hover:bg-orange-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-orange-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotificationMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-88 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header with Title, Badge, Mark Read and Clear buttons */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700">
                      {unreadCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-lg transition cursor-pointer"
                        title="Mark all notifications as read"
                      >
                        <CheckCheck size={13} />
                        <span>Mark Read</span>
                      </button>
                    )}
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                      title="Clear list preview"
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
                  {recentAlerts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No notifications to display
                    </div>
                  ) : (
                    recentAlerts.map((n) => {
                      const Icon = NOTIF_ICONS[n.type] || Bell;
                      return (
                        <div
                          key={n.id || `${n.created_at}_${Math.random()}`}
                          onClick={() => handleAlertClick(n)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 group ${
                            !n.is_read
                              ? "bg-orange-50/50 hover:bg-orange-50 border-orange-100/80"
                              : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-100"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-700">
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-slate-800 truncate">{n.title}</span>
                              {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                              {n.message}
                            </p>
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={(e) => handleMarkSingleRead(e, n.id)}
                              title="Mark this as read"
                              className="text-slate-300 hover:text-orange-600 p-1 rounded-md hover:bg-white transition cursor-pointer shrink-0"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => {
                      setShowNotificationMenu(false);
                      if (onNotificationClick) onNotificationClick();
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-orange-600 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>View All Live Alerts</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1 md:px-2.5 md:py-1 rounded-xl hover:bg-slate-100/80 transition cursor-pointer shrink-0 border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-black shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.full_name || "Admin"}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Super Admin
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:inline ml-0.5" />
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-orange-50/80 to-amber-50/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900">{user.full_name || "Admin User"}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-orange-100 text-orange-700">
                      ROOT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email || "admin@trackintake.com"}</p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <div className="px-3 py-2 text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                    <span>Role Permissions</span>
                    <span className="font-bold text-slate-700">Root Access</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut size={15} />
                    Sign Out of Admin
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
