import { useState, useEffect, useCallback } from "react";
import {
  Calendar, ChevronDown, Search, CheckCircle, Clock, Filter, XCircle,
  ChevronLeft, ChevronRight, IndianRupee, ShieldCheck, CreditCard, RefreshCw,
  AlertTriangle, User, Eye, X, Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getPayments, getPaymentAnalytics } from "../api/payments";
import { API_BASE_URL } from "../config";

const PLAN_COLORS = {
  Basic: "bg-blue-50 text-blue-700 border-blue-200",
  Hero: "bg-orange-50 text-orange-700 border-orange-200",
  Silver: "bg-purple-50 text-purple-700 border-purple-200",
  Premium: "bg-emerald-50 text-emerald-700 border-emerald-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Success" },
  pending: { icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Pending" },
  failed: { icon: XCircle, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Failed" },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SubscriptionPayments({ pageState = {} }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(pageState.timeRange || "all");
  const [selectedDate, setSelectedDate] = useState(pageState.date || new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(pageState.month || new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(pageState.year || new Date().getFullYear().toString());

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_payments: 0,
    success_count: 0,
    failed_count: 0,
    active_subscriptions: 0,
    expiring_soon: 0,
  });
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, successPayments: 0, failedPayments: 0, revenuePerPlan: [] });
  const [plansList, setPlansList] = useState([]);
  const [viewPayment, setViewPayment] = useState(null);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [search]);

  // Load plans list
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscription/plans/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        setPlansList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Plans fetch error:", err));
  }, []);

  const buildParams = useCallback(() => {
    const p = {};
    if (timeRange === "date") p.date = selectedDate;
    if (timeRange === "month") {
      const [y, m] = selectedMonth.split("-");
      p.year = y;
      p.month = m;
    }
    if (timeRange === "year") p.year = selectedYear;
    return p;
  }, [timeRange, selectedDate, selectedMonth, selectedYear]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10, ...buildParams() };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      if (planFilter !== "all") params.plan = planFilter;

      const data = await getPayments(params);
      setPayments(Array.isArray(data.results) ? data.results : []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Payments fetch error:", err);
      setPayments([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, planFilter, buildParams]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Fetch analytics chart
  useEffect(() => {
    const params = buildParams();
    getPaymentAnalytics(params)
      .then((d) => {
        setAnalytics({
          totalRevenue: d.totalRevenue || 0,
          successPayments: d.successPayments || 0,
          failedPayments: d.failedPayments || 0,
          revenuePerPlan: d.revenuePerPlan || [],
        });
      })
      .catch((err) => {
        console.error("Analytics fetch error:", err);
      });
  }, [buildParams]);

  const chartData = (analytics.revenuePerPlan || []).map((p) => ({
    label: p.plan_name || `Plan ${p.plan_id}`,
    revenue: p.revenue || 0,
  }));

  const timeLabel =
    timeRange === "date"
      ? new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : timeRange === "month"
      ? new Date(selectedMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      : timeRange === "year"
      ? selectedYear
      : "All Time";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {/* Detail Modal */}
      {viewPayment && (
        <PaymentDetailModal payment={viewPayment} onClose={() => setViewPayment(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Financial Settlements & Invoicing
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {totalCount} Transactions Recorded
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Subscription Payments</h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
            <Calendar size={14} className="text-slate-400" />
            <span>Audit History & Subscriptions · {timeLabel}</span>
          </div>
        </div>

        {/* Date / Period Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {timeRange === "date" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-medium text-slate-700"
            />
          )}
          {timeRange === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-medium text-slate-700"
            />
          )}
          {timeRange === "year" && (
            <input
              type="number"
              min="2020"
              max="2100"
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-medium text-slate-700 w-24"
            />
          )}

          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs md:text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-400/20 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="date">Specific Date</option>
              <option value="month">Monthly</option>
              <option value="year">Annual</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => loadPayments()}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue, Active Subscriptions, Expiring Soon, Success Rate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₹${(metrics.total_revenue || 0).toLocaleString()}`,
            sub: "Settled payments",
            color: "text-orange-600",
            bg: "bg-white",
            border: "border-orange-200",
            icon: IndianRupee,
            active: statusFilter === "all" && planFilter === "all",
            onClick: () => { setStatusFilter("all"); setPlanFilter("all"); setPage(1); }
          },
          {
            label: "Active Subscriptions",
            value: metrics.active_subscriptions || 0,
            sub: "Currently running",
            color: "text-emerald-600",
            bg: "bg-white",
            border: "border-emerald-200",
            icon: ShieldCheck,
            active: false,
            onClick: () => { setStatusFilter("success"); setPage(1); }
          },
          {
            label: "Expiring Soon",
            value: metrics.expiring_soon || 0,
            sub: "In next 30 days",
            color: "text-amber-600",
            bg: "bg-white",
            border: "border-amber-200",
            icon: AlertTriangle,
            active: false,
            onClick: () => { setStatusFilter("all"); setPage(1); }
          },
          {
            label: "Successful Payments",
            value: `${metrics.success_count || 0} / ${metrics.total_payments || 0}`,
            sub: "Completed transactions",
            color: "text-blue-600",
            bg: "bg-white",
            border: "border-blue-200",
            icon: CreditCard,
            active: statusFilter === "success",
            onClick: () => { setStatusFilter("success"); setPage(1); }
          },
        ].map(({ label, value, sub, color, bg, border, icon: Icon, active, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`${bg} rounded-2xl border ${border} shadow-xs p-4 md:p-5 transition hover:-translate-y-0.5 duration-200 cursor-pointer ${
              active ? "ring-2 ring-orange-500/20 shadow-md" : "hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                <p className={`text-xl md:text-2xl font-black ${color} mt-1.5 tracking-tight`}>{value}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{sub}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All Transactions" },
          { id: "success", label: "Successful" },
          { id: "pending", label: "Pending Verification" },
          { id: "failed", label: "Failed Attempts" },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => { setStatusFilter(p.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === p.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Plan Revenue Breakdown Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-extrabold text-sm text-gray-800">Revenue per Subscription Plan</p>
              <p className="text-xs text-gray-400">Total collections across membership tiers</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: 12 }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={45}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "#f97316" : "#fb923c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, email, payment ID, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition"
          />
        </div>

        {/* Plan Filter */}
        <div className="relative w-full sm:w-44">
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-3.5 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700 font-medium"
          >
            <option value="all">All Plans</option>
            {plansList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative w-full sm:w-40">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-3.5 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700 font-medium"
          >
            <option value="all">Status: All</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table Desktop View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden hidden md:flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Customer", "Plan Tier", "Amount", "Payment Reference", "Status", "Subscription Period", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm animate-pulse">
                    Loading payments and subscription records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    No payment records found matching the current filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const statusKey = p.payment_status?.toLowerCase();
                  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr key={p.payment_id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 flex items-center justify-center text-xs font-black shrink-0">
                            {(p.user_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 block truncate">{p.user_name || "Unknown"}</span>
                            <span className="text-xs text-gray-500 truncate block">{p.email || p.pending_email || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${PLAN_COLORS[p.plan_name] || PLAN_COLORS.default}`}>
                          {p.plan_name || "Custom"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-gray-900">
                          ₹{(p.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Payment Ref */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs text-gray-700 font-semibold truncate max-w-[160px]" title={p.razorpay_payment_id || `ID #${p.payment_id}`}>
                            {p.razorpay_payment_id || `ID #${p.payment_id}`}
                          </div>
                          {p.razorpay_order_id && (
                            <div className="font-mono text-[10px] text-gray-400 truncate max-w-[160px]" title={p.razorpay_order_id}>
                              {p.razorpay_order_id}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={12} strokeWidth={2.5} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Subscription period & active status */}
                      <td className="px-5 py-4 text-xs">
                        {p.start_date && p.end_date ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-gray-700">
                              <span>{fmt(p.start_date)} → {fmt(p.end_date)}</span>
                            </div>
                            <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              p.is_active_subscription
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {p.is_active_subscription ? "Active Subscription" : "Expired"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">{fmt(p.created_at)}</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setViewPayment(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white text-xs text-gray-500 font-medium">
          <span>
            Showing {totalCount === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            No payments found.
          </div>
        ) : (
          payments.map((p) => {
            const statusKey = p.payment_status?.toLowerCase();
            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;

            return (
              <div key={p.payment_id} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 flex items-center justify-center text-xs font-black shrink-0">
                      {(p.user_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{p.user_name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 truncate">{p.email || p.pending_email || "—"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon size={10} strokeWidth={2.5} />
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-50">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Plan & Amount</span>
                    <span className="font-extrabold text-gray-900 text-sm">₹{(p.amount || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">({p.plan_name})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Payment Ref</span>
                    <span className="font-mono text-xs text-gray-700 truncate block">
                      {p.razorpay_payment_id || `#${p.payment_id}`}
                    </span>
                  </div>
                </div>

                {p.start_date && p.end_date && (
                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-500 font-medium">
                      {fmt(p.start_date)} → {fmt(p.end_date)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.is_active_subscription ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                    }`}>
                      {p.is_active_subscription ? "Active" : "Expired"}
                    </span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setViewPayment(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                  >
                    <Eye size={13} /> View Full Receipt
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENT DETAIL MODAL ───────────────────────────────────────────────────
function PaymentDetailModal({ payment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700">
              Payment Receipt
            </span>
            <h2 className="text-xl font-black text-gray-900 mt-1">Transaction #{payment.payment_id}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer</span>
              <span className="text-sm font-bold text-gray-800 mt-0.5 block">{payment.user_name || "Unknown"}</span>
              <span className="text-gray-500 block truncate">{payment.email || payment.pending_email || "—"}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Amount Paid</span>
              <span className="text-xl font-black text-gray-900 mt-0.5 block">₹{(payment.amount || 0).toLocaleString()}</span>
              <span className="text-emerald-600 font-bold uppercase text-[10px]">{payment.payment_status}</span>
            </div>
          </div>

          <div className="space-y-2 bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Transaction Identifiers</h4>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400">Razorpay Payment ID:</span>
              <span className="font-mono font-semibold text-gray-800">{payment.razorpay_payment_id || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400">Razorpay Order ID:</span>
              <span className="font-mono font-semibold text-gray-800">{payment.razorpay_order_id || "—"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400">Payment Gateway Type:</span>
              <span className="font-semibold text-gray-800">{payment.payment_type || "Razorpay Standard"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Created At:</span>
              <span className="font-semibold text-gray-800">{fmt(payment.created_at)}</span>
            </div>
          </div>

          {payment.start_date && (
            <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-4 space-y-2">
              <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Subscription Coverage</h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Tier:</span>
                <span className="font-bold text-gray-900">{payment.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Start Date:</span>
                <span className="font-semibold text-gray-800">{fmt(payment.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">End Date:</span>
                <span className="font-semibold text-gray-800">{fmt(payment.end_date)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-orange-100">
                <span className="text-gray-500">Subscription Status:</span>
                <span className={`font-bold ${payment.is_active_subscription ? "text-emerald-700" : "text-gray-500"}`}>
                  {payment.is_active_subscription ? "Active & Running" : "Expired / Inactive"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
