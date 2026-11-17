import {
  LayoutDashboard, Users, ShieldCheck, CreditCard,
  CalendarCheck, BookOpen, IndianRupee, X, ChevronRight,
  Sparkles, Activity, ShieldAlert, Settings as SettingsIcon,
  UserCheck, Bell
} from "lucide-react";

export default function Sidebar({ active, onNavigate, isOpen, onClose, unreadCount = 0 }) {
  const NAV_SECTIONS = [
    {
      group: "OVERVIEW",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null, color: "text-orange-500" },
        { id: "users", label: "User Management", icon: Users, badge: null, color: "text-blue-500" },
        { id: "assignments", label: "Patient Assignment", icon: UserCheck, badge: null, color: "text-teal-500" },
        { id: "approvals", label: "Approve Profiles", icon: ShieldCheck, badge: null, color: "text-emerald-500" },
      ]
    },
    {
      group: "BILLING & OPERATIONS",
      items: [
        { id: "plans", label: "Subscription Plans", icon: CreditCard, badge: null, color: "text-purple-500" },
        { id: "payments", label: "Payments & Invoices", icon: CreditCard, badge: null, color: "text-indigo-500" },
        { id: "appointments", label: "Appointments", icon: CalendarCheck, badge: null, color: "text-sky-500" },
        { id: "payables", label: "Payables & Refunds", icon: IndianRupee, badge: null, color: "text-amber-500" },
      ]
    },
    {
      group: "CONTENT & MARKETING",
      items: [
        { id: "blogs", label: "Blogs & Articles", icon: BookOpen, badge: null, color: "text-rose-500" },
      ]
    },
    {
      group: "CONFIGURATION",
      items: [
        { id: "settings", label: "System Settings", icon: SettingsIcon, badge: null, color: "text-slate-500" },
        { id: "notifications", label: "Live Alerts", icon: Bell, badge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : null, color: "text-amber-500" },
      ]
    }
  ];

  const handleNavigate = (id) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-72 bg-white border-r border-slate-200/80 flex flex-col shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out select-none shrink-0
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-orange-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-white flex items-center justify-center font-black text-base shadow-md shadow-orange-500/25 tracking-wider">
                TI
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  Track<span className="text-orange-500">Intake</span>
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                Admin Console <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 font-bold">PRO</span>
              </p>
            </div>
          </div>
          {/* Mobile Close */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.group} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                {section.group}
              </p>
              {section.items.map(({ id, label, icon: Icon, badge, color }) => {
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleNavigate(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-150 cursor-pointer group relative text-left
                      ${isActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100/80 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600"
                    }`}>
                      <Icon size={17} />
                    </div>
                    <span className="whitespace-nowrap flex-1 tracking-tight">{label}</span>
                    {badge && !isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 shrink-0">
                        {badge}
                      </span>
                    )}
                    {isActive ? (
                      <ChevronRight size={15} className="text-white/80 shrink-0" />
                    ) : (
                      <ChevronRight size={15} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer info box */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Live DB Active</p>
                <p className="text-[10px] text-slate-400">AWS ap-south-1 Pooler</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              v2.6
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
