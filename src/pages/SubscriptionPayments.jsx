import { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronDown, Search, CheckCircle, Clock, Filter, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getPayments, getPaymentAnalytics } from "../api/payments";
import { API_BASE_URL } from "../config";

const PLAN_COLORS = {
  Basic: "bg-blue-50 text-blue-600",
  Hero: "bg-orange-50 text-orange-600",
  Silver: "bg-purple-50 text-purple-600",
  default: "bg-gray-100 text-gray-600",
};
const STATUS_ICONS = { success: <CheckCircle size={11} />, pending: <Clock size={11} />, failed: <XCircle size={11} /> };
const STATUS_COLORS = { success: "bg-green-50 text-green-600", pending: "bg-yellow-50 text-yellow-600", failed: "bg-red-50 text-red-600" };

export default function SubscriptionPayments() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, successPayments: 0, failedPayments: 0, revenuePerPlan: [] });
  const [plansMap, setPlansMap] = useState({});

  // debounce search
  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(h);
  }, [search]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [statusFilter, timeRange, selectedDate, selectedMonth, selectedYear]);

  // load plans map for chart
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscription/plans/`)
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const m = {};
        (Array.isArray(list) ? list : []).forEach(p => { m[p.id] = p.name; });
        setPlansMap(m);
      })
      .catch((err) => {
        console.error('Plans fetch error:', err);
      });
  }, []);

  const buildParams = useCallback(() => {
    const p = {};
    if (timeRange === "date") p.date = selectedDate;
    if (timeRange === "month") { const [y, m] = selectedMonth.split("-"); p.year = y; p.month = m; }
    if (timeRange === "year") p.year = selectedYear;
    return p;
  }, [timeRange, selectedDate, selectedMonth, selectedYear]);

  // fetch payments — reads data.results from paginated backend response
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10, ...buildParams() };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getPayments(params);
      setPayments(Array.isArray(data.results) ? data.results : []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("payments fetch error:", err);
      setPayments([]); setTotalCount(0); setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, buildParams]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // fetch analytics
  useEffect(() => {
    const params = buildParams();
    getPaymentAnalytics(params)
      .then(d => {
        console.log('Analytics data received:', d);
        setAnalytics({
          totalRevenue: d.totalRevenue || 0,
          successPayments: d.successPayments || 0,
          failedPayments: d.failedPayments || 0,
          revenuePerPlan: d.revenuePerPlan || [],
        });
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err);
        setAnalytics({ totalRevenue: 0, successPayments: 0, failedPayments: 0, revenuePerPlan: [] });
      });
  }, [buildParams]);

  const chartData = analytics.revenuePerPlan.map(p => ({
    label: p.plan_name || plansMap[p.plan_id] || `Plan ${p.plan_id}`,
    revenue: p.revenue,
  }));

  const timeLabel =
    timeRange === "date" ? new Date(selectedDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : timeRange === "month" ? new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : timeRange === "year" ? selectedYear
    : "All Time";

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Payments</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">{timeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {timeRange === "date" && (
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium text-gray-700" />
          )}
          {timeRange === "month" && (
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium text-gray-700" />
          )}
          {timeRange === "year" && (
            <input type="number" min="2020" max="2100" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium text-gray-700 w-24" />
          )}
          <div className="relative">
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
              className="appearance-none px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer pr-10">
              <option value="all">All Time</option>
              <option value="date">Date</option>
              <option value="month">Monthly</option>
              <option value="year">Year</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: `Total Revenue (${timeRange})`, value: `Rs ${analytics.totalRevenue.toLocaleString()}`, sub: "From successful payments", color: "text-orange-500", border: "border-orange-400" },
          { label: "Successful Payments", value: analytics.successPayments, sub: "Completed transactions", color: "text-green-600", border: "border-green-400" },
          { label: "Failed Payments", value: analytics.failedPayments, sub: "Unsuccessful attempts", color: "text-red-500", border: "border-red-400" },
        ].map(({ label, value, sub, color, border }) => (
          <div key={label} className={`bg-white rounded-xl border-t-2 ${border} border-x border-b border-gray-100 shadow-sm p-5`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-900">Revenue per Plan</p>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">Distribution breakdown</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`Rs ${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 12 }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#f97316" : "#fb923c"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-sm text-gray-400">No revenue data for this period.</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none pl-4 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700">
            <option value="all">Status: All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["User", "Email", "Plan", "Payment ID", "Status", "Duration"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm animate-pulse">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No payments found.</td></tr>
              ) : payments.map((p, i) => (
                <tr key={i} className={`border-b border-gray-50 hover:bg-orange-50/20 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{p.user_name || "Unknown"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{p.email || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${PLAN_COLORS[p.plan_name] || PLAN_COLORS.default}`}>
                      {p.plan_name || "Free"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{p.payment_id || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[p.payment_status?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_ICONS[p.payment_status?.toLowerCase()] || <Filter size={11} />}
                      {p.payment_status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    <div className="flex flex-col gap-0.5">
                      <span>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"}</span>
                      <span className="text-gray-400">to {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white">
          <span className="text-xs text-gray-500 font-medium">
            Showing {totalCount === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, totalCount)} of {totalCount} entries
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-gray-700 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}