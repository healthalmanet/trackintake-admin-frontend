import React from "react";
import {
  UserPlus, CreditCard, AlertTriangle, CalendarCheck,
  CalendarX, AlertCircle, X, ChevronRight, BellRing
} from "lucide-react";

const CATEGORY_STYLES = {
  "Registration": {
    icon: UserPlus,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glow: "border-emerald-400/60 shadow-emerald-500/10",
    barBg: "bg-emerald-500",
    actionLabel: "Review Profile",
    actionPage: "approvals",
  },
  "Plan Purchase": {
    icon: CreditCard,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    glow: "border-blue-400/60 shadow-blue-500/10",
    barBg: "bg-blue-500",
    actionLabel: "View Payment",
    actionPage: "payments",
  },
  "Payment Failed": {
    icon: AlertTriangle,
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    glow: "border-rose-400/60 shadow-rose-500/10",
    barBg: "bg-rose-500",
    actionLabel: "Check Payments",
    actionPage: "payments",
  },
  "Appointment": {
    icon: CalendarCheck,
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    glow: "border-sky-400/60 shadow-sky-500/10",
    barBg: "bg-sky-500",
    actionLabel: "View Appointments",
    actionPage: "appointments",
  },
  "Appointment Cancelled": {
    icon: CalendarX,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    glow: "border-amber-400/60 shadow-amber-500/10",
    barBg: "bg-amber-500",
    actionLabel: "View Booking",
    actionPage: "appointments",
  },
  "Appointment Failed": {
    icon: AlertCircle,
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    glow: "border-rose-400/60 shadow-rose-500/10",
    barBg: "bg-rose-500",
    actionLabel: "View Schedule",
    actionPage: "appointments",
  },
};

export default function NotificationToastContainer({ toasts = [], onDismiss, onNavigate }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const style = CATEGORY_STYLES[toast.type] || {
          icon: BellRing,
          badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
          glow: "border-orange-400/60 shadow-orange-500/10",
          barBg: "bg-orange-500",
          actionLabel: "View Details",
          actionPage: "notifications",
        };
        const Icon = style.icon;
        const page = toast.metadata?.page || style.actionPage;
        const actionLabel = toast.metadata?.action_label || style.actionLabel;

        return (
          <div
            key={toast.toastId}
            className={`pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border ${style.glow} shadow-xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${style.badgeBg}`}>
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                    {toast.type || "Live Alert"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Just now</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                  {toast.title || "Notification"}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {toast.message}
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(page, toast.metadata || {});
                      }
                      onDismiss(toast.toastId);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>{actionLabel}</span>
                    <ChevronRight size={12} />
                  </button>

                  <button
                    onClick={() => onDismiss(toast.toastId)}
                    className="px-2 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.toastId)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer -mr-1 -mt-1"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

