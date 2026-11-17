import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, UserCheck, CalendarCheck, IndianRupee,
  TrendingUp, Loader2, Calendar as CalendarIcon, Clock, Activity,
  BarChart2, ChevronDown, PieChart as PieChartIcon, Building2,
  Award, Sparkles, Video, CheckCircle2, AlertCircle, RefreshCw,
  ArrowRight, ShieldCheck, Stethoscope
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid
} from "recharts";
import { getDashboardOverview } from "../api/dashboard";

const PLAN_COLORS = ["#f97316", "#3b82f6", "#a855f7", "#22c55e", "#eab308", "#ec4899", "#6366f1"];

function formatTimeAgo(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const diffMins = Math.floor((new Date() - date) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  const diffDays = Math.floor(diffMins / 1440);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, label, value, subtext, tag, color, border, bgIcon, delay = 0, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-t-[3px] ${border} border-x border-b border-slate-200/80 shadow-xs hover:shadow-md p-5 transition-all duration-300 transform hover:-translate-y-1 ${
        onClick ? "cursor-pointer group ring-1 ring-transparent hover:ring-orange-200" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight ${color}`}>
            {value}
          </p>
          {(subtext || tag) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {tag && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {tag}
                </span>
              )}
              {subtext && (
                <span className="text-xs text-slate-400 font-medium truncate">
                  {subtext}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgIcon} shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon size={22} className={color} strokeWidth={2.5} />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">
          <span>View records</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );
}

const CustomDot = ({ cx, cy, fill }) => (
  <circle cx={cx} cy={cy} r={4} fill={fill || "#f97316"} stroke="#fff" strokeWidth={2} />
);

export default function Dashboard({ pageState }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [activeActivityTab, setActiveActivityTab] = useState("signups");

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getDashboardOverview({
        range: timeRange,
        date: timeRange === "day" ? selectedDate : timeRange === "month" ? selectedMonth : undefined,
        month: timeRange === "month" ? selectedMonth.split("-")[1] : undefined,
        year: timeRange === "month" ? selectedMonth.split("-")[0] : timeRange === "year" ? selectedYear : undefined,
      });

      if (res && res.status === "success") {
        setData(res);
      }
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation Handlers to relevant pages with filters
  const navigateTo = (page, state = {}) => {
    window.dispatchEvent(new CustomEvent("app-nav", { detail: { page, state } }));
  };

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recentActivity = data?.recent_activity || {};

  // Compute label for the currently active filter
  const filterLabel = useMemo(() => {
    if (timeRange === "all") return "All Time Performance";
    if (timeRange === "day") {
      return `Date: ${new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (timeRange === "week") return "Last 7 Days (Weekly)";
    if (timeRange === "month") {
      const [y, m] = selectedMonth.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return `Month: ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    }
    if (timeRange === "year") return `Year: ${selectedYear}`;
    return "Custom Filter";
  }, [timeRange, selectedDate, selectedMonth, selectedYear]);

  // Primary Metrics Cards (Clean, 8 Key Performance Indicators)
  const stats = [
    {
      label: "Total Users",
      value: (metrics.total_users ?? 0).toLocaleString(),
      tag: `${metrics.active_users ?? 0} active`,
      subtext: timeRange !== "all" ? `All-time: ${metrics.all_time?.total_users ?? 0}` : "All registered accounts",
      icon: Users,
      color: "text-blue-600",
      border: "border-blue-500",
      bgIcon: "bg-blue-50",
      onClick: () => navigateTo("users", { planFilter: "All" }),
    },
    {
      label: "Total Patients",
      value: (metrics.total_patients ?? 0).toLocaleString(),
      tag: `${metrics.total_users ? Math.round(((metrics.total_patients ?? 0) / metrics.total_users) * 100) : 0}% of users`,
      subtext: "Client patient base",
      icon: UserCheck,
      color: "text-emerald-600",
      border: "border-emerald-500",
      bgIcon: "bg-emerald-50",
      onClick: () => navigateTo("users", { role: "user" }),
    },
    {
      label: "Total Nutritionists",
      value: (metrics.total_nutritionists ?? 0).toLocaleString(),
      tag: `${metrics.inhouse_consultants ?? 0} in-house · ${metrics.expert_consultants ?? 0} expert`,
      subtext: "Healthcare providers",
      icon: Stethoscope,
      color: "text-purple-600",
      border: "border-purple-500",
      bgIcon: "bg-purple-50",
      onClick: () => navigateTo("approvals"),
    },
    {
      label: "Total Revenue",
      value: `Rs ${(metrics.total_revenue ?? 0).toLocaleString()}`,
      tag: "Verified payments",
      subtext: timeRange !== "all" ? `All-time: Rs ${(metrics.all_time?.total_revenue ?? 0).toLocaleString()}` : "Subscription plans",
      icon: IndianRupee,
      color: "text-orange-500",
      border: "border-orange-500",
      bgIcon: "bg-orange-50",
      onClick: () => navigateTo("payments"),
    },
    {
      label: "In-House Consultants",
      value: (metrics.inhouse_consultants ?? 0).toLocaleString(),
      tag: "Internal team",
      subtext: "Full-time dietitians",
      icon: Building2,
      color: "text-sky-600",
      border: "border-sky-500",
      bgIcon: "bg-sky-50",
      onClick: () => navigateTo("approvals"),
    },
    {
      label: "Expert Consultants",
      value: (metrics.expert_consultants ?? 0).toLocaleString(),
      tag: "Specialist network",
      subtext: "External clinical experts",
      icon: Award,
      color: "text-violet-600",
      border: "border-violet-500",
      bgIcon: "bg-violet-50",
      onClick: () => navigateTo("approvals"),
    },
    {
      label: "In-House Consultations",
      value: (metrics.inhouse_consultations ?? 0).toLocaleString(),
      tag: `${metrics.total_consultations ? Math.round(((metrics.inhouse_consultations ?? 0) / metrics.total_consultations) * 100) : 0}% of sessions`,
      subtext: "Delivered by staff",
      icon: CalendarCheck,
      color: "text-indigo-600",
      border: "border-indigo-500",
      bgIcon: "bg-indigo-50",
      onClick: () => navigateTo("appointments", { category: "IN_HOUSE" }),
    },
    {
      label: "Expert Consultations",
      value: (metrics.expert_consultations ?? 0).toLocaleString(),
      tag: `${metrics.total_consultations ? Math.round(((metrics.expert_consultations ?? 0) / metrics.total_consultations) * 100) : 0}% of sessions`,
      subtext: "Delivered by specialists",
      icon: Sparkles,
      color: "text-pink-600",
      border: "border-pink-500",
      bgIcon: "bg-pink-50",
      onClick: () => navigateTo("appointments", { category: "EXPERT" }),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-full">
      {/* ================= Header & Global Filter Bar ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Executive Intelligence
            </span>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Pulse
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard & Platform Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {filterLabel} · Real-time user acquisition, verified revenue and clinical operations
          </p>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Pills */}
          <div className="inline-flex p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs font-bold">
            {[
              { id: "all", label: "All Time" },
              { id: "day", label: "Date" },
              { id: "week", label: "Weekly" },
              { id: "month", label: "Monthly" },
              { id: "year", label: "Yearly" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === tab.id
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contextual Date Selectors */}
          {timeRange === "day" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          )}

          {timeRange === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          )}

          {timeRange === "year" && (
            <input
              type="number"
              min="2020"
              max="2035"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 w-24 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Refresh statistics"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-orange-500" : ""} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-100">
          <Loader2 size={36} className="animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-semibold text-gray-600">Gathering administrative metrics...</p>
        </div>
      ) : (
        <>
          {/* ================= Primary KPI Cards (8 Key Metrics) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, idx) => (
              <StatCard key={s.label} {...s} delay={idx * 50} />
            ))}
          </div>

          {/* ================= Row 1: Charts (Growth & Revenue Trends) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User & Patient Acquisition Trajectory */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-600" />
                    User Acquisition & Growth
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Registration trajectory over selected time window
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total Users
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Patients
                  </span>
                </div>
              </div>

              {charts.user_growth && charts.user_growth.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={charts.user_growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="patientGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontWeight: 600,
                        fontSize: "12px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Total Users"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#userGrowthGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      name="Patients"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#patientGrowthGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Activity size={40} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No user signups in this filter</p>
                  <p className="text-xs text-gray-400 mt-1">Switch to All Time or select another period</p>
                </div>
              )}
            </div>

            {/* Revenue Analytics & Trend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <BarChart2 size={18} className="text-orange-500" />
                      Revenue Performance
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Earnings generated across successful subscriptions
                    </p>
                  </div>
                  <span className="text-base font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-xl">
                    Rs {(metrics.total_revenue ?? 0).toLocaleString()}
                  </span>
                </div>

                {/* Plan Revenue Pills */}
                {charts.revenue_by_plan && charts.revenue_by_plan.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {charts.revenue_by_plan.slice(0, 4).map((p, idx) => (
                      <span
                        key={p.plan_id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 font-semibold text-gray-700 flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[idx % PLAN_COLORS.length] }} />
                        {p.plan_name}: Rs {p.total_revenue.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {charts.revenue_trend && charts.revenue_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={charts.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `Rs ${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontWeight: 600,
                        fontSize: "12px"
                      }}
                      formatter={(val) => [`Rs ${Number(val).toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <IndianRupee size={36} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No revenue events in this filter</p>
                  <p className="text-xs text-gray-400 mt-0.5">Switch filter to view overall financial history</p>
                </div>
              )}
            </div>
          </div>

          {/* ================= Row 2: Breakdowns (Consultations, Plans, Workforce) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Consultations Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <CalendarCheck size={18} className="text-indigo-600" />
                      Consultation Sessions
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Session distribution & appointment status
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                    {metrics.total_consultations ?? 0} Total
                  </span>
                </div>

                {/* In-House vs Expert Progress Comparison */}
                <div className="space-y-4 my-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-blue-500" /> In-House Consultations
                      </span>
                      <span>
                        {metrics.inhouse_consultations ?? 0} ({metrics.total_consultations ? Math.round(((metrics.inhouse_consultations ?? 0) / metrics.total_consultations) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${metrics.total_consultations ? ((metrics.inhouse_consultations ?? 0) / metrics.total_consultations) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-purple-500" /> Expert Consultations
                      </span>
                      <span>
                        {metrics.expert_consultations ?? 0} ({metrics.total_consultations ? Math.round(((metrics.expert_consultations ?? 0) / metrics.total_consultations) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${metrics.total_consultations ? ((metrics.expert_consultations ?? 0) / metrics.total_consultations) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mode Breakdown (Virtual vs Clinic) */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100/60">
                    <p className="text-[11px] font-semibold text-sky-700 flex items-center gap-1">
                      <Video size={12} /> Virtual Video
                    </p>
                    <p className="text-lg font-extrabold text-sky-900 mt-0.5">
                      {metrics.virtual_consultations ?? 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/60">
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Building2 size={12} /> In-Person Clinic
                    </p>
                    <p className="text-lg font-extrabold text-emerald-900 mt-0.5">
                      {metrics.inperson_consultations ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-xs font-semibold pt-4 mt-4 border-t border-gray-100 text-gray-500">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={13} /> {metrics.confirmed_consultations ?? 0} Confirmed
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock size={13} /> {metrics.pending_consultations ?? 0} Pending
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle size={13} /> {metrics.cancelled_consultations ?? 0} Cancelled
                </span>
              </div>
            </div>

            {/* Plan Distribution (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-orange-500" />
                  Subscription Distribution
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5 mb-4">
                  User distribution across active subscription tiers
                </p>

                {charts.plan_distribution && charts.plan_distribution.length > 0 ? (
                  <>
                    <div className="flex justify-center my-2">
                      <PieChart width={190} height={190}>
                        <Pie
                          data={charts.plan_distribution}
                          cx={95}
                          cy={95}
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="users"
                          stroke="none"
                        >
                          {charts.plan_distribution.map((entry, idx) => (
                            <Cell key={entry.plan_id} fill={PLAN_COLORS[idx % PLAN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                            fontWeight: 600
                          }}
                          formatter={(val, name, props) => [`${val} users (${props.payload.percentage}%)`, props.payload.plan_name]}
                        />
                      </PieChart>
                    </div>

                    <div className="space-y-2 mt-3 max-h-36 overflow-y-auto pr-1">
                      {charts.plan_distribution.map((p, idx) => (
                        <div key={p.plan_id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-semibold text-gray-700 truncate max-w-[150px]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PLAN_COLORS[idx % PLAN_COLORS.length] }} />
                            {p.plan_name}
                          </span>
                          <span className="font-extrabold text-gray-900">{p.users} users</span>
                          <span className="text-gray-400 font-medium">{p.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-52 text-center">
                    <PieChartIcon size={36} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-500">No active plans in filter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workforce & Nutritionist Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-purple-600" />
                      Nutritionist Workforce
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Clinical coverage and provider verification
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                    {metrics.total_nutritionists ?? 0} Staff
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Building2 size={14} className="text-blue-500" /> In-House Nutritionists
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Full-time internal medical team</p>
                    </div>
                    <span className="text-lg font-extrabold text-blue-600">
                      {metrics.inhouse_consultants ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Award size={14} className="text-purple-500" /> Specialist Experts
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Consultant partner doctors</p>
                    </div>
                    <span className="text-lg font-extrabold text-purple-600">
                      {metrics.expert_consultants ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Active Patient Coverage
                      </p>
                      <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Assigned to client care</p>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-700">
                      {metrics.total_patients ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigateTo("nutritionists")}
                className="mt-5 w-full py-2.5 px-4 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Manage Nutritionist Team <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* ================= Row 3: Live System Activity (Feeds) ================= */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Clock size={18} className="text-orange-500" />
                  Live Administrative Activity
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Recent signups, subscription purchases, and consultation bookings
                </p>
              </div>

              {/* Feed Tabs */}
              <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveActivityTab("signups")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeActivityTab === "signups"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Recent Users
                </button>
                <button
                  onClick={() => setActiveActivityTab("payments")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeActivityTab === "payments"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Recent Payments
                </button>
                <button
                  onClick={() => setActiveActivityTab("consultations")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeActivityTab === "consultations"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Recent Consultations
                </button>
              </div>
            </div>

            {/* Tab 1: Recent Signups */}
            {activeActivityTab === "signups" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(recentActivity.recent_signups || []).map((u) => {
                  const isNutri = (u.role || "").toLowerCase() === "nutritionist";
                  const isAdmin = (u.role || "").toLowerCase() === "admin";
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xs transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isNutri ? "bg-purple-100 text-purple-700" : isAdmin ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {(u.full_name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{u.full_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isNutri ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {u.role || "user"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(u.date_joined)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Recent Payments */}
            {activeActivityTab === "payments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(recentActivity.recent_payments || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xs transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <IndianRupee size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.user_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.plan_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-gray-900">
                        Rs {p.amount}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Recent Consultations */}
            {activeActivityTab === "consultations" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(recentActivity.recent_consultations || []).map((c) => {
                  const isExpert = (c.category || "").toUpperCase() === "EXPERT";
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xs transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isExpert ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {c.type === "VIRTUAL" ? <Video size={16} /> : <Building2 size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {c.patient_name} <span className="text-gray-400 font-normal">with</span> {c.nutritionist_name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {c.slot_date || "Date scheduled"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isExpert ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {isExpert ? "Expert" : "In-House"}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(c.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
