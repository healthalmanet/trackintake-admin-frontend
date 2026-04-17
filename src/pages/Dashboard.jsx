import { useEffect, useState } from "react";
import {
  Users, UserCheck, CalendarCheck, IndianRupee,
  TrendingUp, TrendingDown, Loader2, Calendar as CalendarIcon, Clock, Activity, BarChart2, ChevronDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid
} from "recharts";
import { getDashboardStats } from "../api/dashboard";

const PLAN_COLORS = { free: "#9ca3af", basic: "#3b82f6", hero: "#f97316", silver: "#a855f7" };
const PLAN_COLOR_LIST = ["#f97316", "#3b82f6", "#a855f7", "#22c55e", "#eab308"];

const MEAL_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];

function formatActivity(activities) {
  const colors = ["bg-orange-100 text-orange-600", "bg-blue-100 text-blue-600", "bg-green-100 text-green-600", "bg-pink-100 text-pink-600", "bg-purple-100 text-purple-600"];
  
  return activities.slice(0, 8).map((item, i) => {
    const name = item.full_name || `User ${item.user_id || 'Unknown'}`;
    const parts = name.split(" ");
    
    const date = new Date(item.date_joined || item.created_at);
    const diffMins = Math.floor((new Date() - date) / 60000);
    let ago = "Just now";
    if (diffMins > 0) {
      if (diffMins < 60) ago = `${diffMins}m ago`;
      else if (diffMins < 1440) ago = `${Math.floor(diffMins/60)}h ago`;
      else ago = `${Math.floor(diffMins/1440)}d ago`;
    }

    return {
      initials: parts.map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U",
      name: name,
      action: item.activity,
      ago: ago,
      color: colors[i % colors.length],
    };
  });
}

function StatCard({ icon: Icon, label, value, color, border, delay, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border-t-[3px] ${border} shadow-sm hover:shadow-md p-5 transition-all duration-500 ease-out transform hover:-translate-y-1.5 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] ${onClick ? "cursor-pointer ring-2 ring-transparent hover:ring-orange-200" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-1.5">
            {label}
          </p>
          <p className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("600", "50").replace("500", "50")} shadow-inner saturate-150`}>
          <Icon size={24} className={color} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

const CustomDot = ({ cx, cy, fill }) => <circle cx={cx} cy={cy} r={4.5} fill={fill || "#f97316"} stroke="#fff" strokeWidth={2.5} className="transition-all duration-300 hover:r-6" />;

export default function Dashboard({ pageState }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [plansMap, setPlansMap] = useState({});

  // Fetch plans map once
  useEffect(() => {
    fetch("/api/subscription/plans/")
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        const m = {};
        (Array.isArray(list) ? list : []).forEach(p => { m[p.id] = p.name; });
        setPlansMap(m);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let apiDate = undefined;
    if (timeRange === "day") apiDate = selectedDate;
    if (timeRange === "month") apiDate = selectedMonth;
    if (timeRange === "year") apiDate = selectedYear;
    // timeRange === "all" → apiDate stays undefined → backend returns all-time data

    // Assuming backend takes ?timeRange=... and optional ?date=...
    getDashboardStats({ range: timeRange, date: apiDate })
      .then((res) => {
        setData({
          totalUsers: res.totalUsers,
          activeUsers: res.activeUsers,
          totalRevenue: res.totalRevenue ?? 0,
          revenueByPlan: res.revenueByPlan ?? [],
          pendingAppts: res.pendingAppts ?? 0,
          growthData: res.userGrowth?.length ? res.userGrowth : [],
          planDist: (res.planDistribution ?? []).map((p, i) => {
            const planName = plansMap[p.plan_id] || plansMap[p.plan] || p.plan || `Plan ${p.plan_id}`;
            return {
              name: planName,
              value: p.users ?? p.count ?? 0,
              pct: res.totalUsers ? Math.round(((p.users ?? p.count ?? 0) / res.totalUsers) * 100) : 0,
              color: PLAN_COLORS[planName.toLowerCase()] ?? PLAN_COLOR_LIST[i % PLAN_COLOR_LIST.length],
            };
          }),
          revenueTrend: (res.revenueByPlan ?? []).map((p, i) => ({
            month: plansMap[p.plan_id] || `Plan ${p.plan_id}`,
            revenue: p.total_revenue ?? 0,
          })),
          mealCats: res.mealCats?.length ? res.mealCats : [],
          activity: formatActivity(res.recentActivity || []),
        });
      })
      .catch((err) => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [timeRange, selectedDate, selectedMonth, selectedYear, plansMap]);

  const handleRevenueClick = () => {
    const targetRange = timeRange === "day" ? "date" : timeRange;
    const state = { timeRange: targetRange };
    
    if (timeRange === "day") state.date = selectedDate;
    if (timeRange === "month") state.month = selectedMonth;
    if (timeRange === "year") state.year = selectedYear;
    
    window.dispatchEvent(new CustomEvent("app-nav", { detail: { page: "payments", state } }));
  };

  const handleUserClick = (status = "All") => {
    const mode = timeRange === "day" ? "date" : timeRange;
    const state = { dateFilterMode: mode, statusFilter: status };
    
    if (timeRange === "day") state.dateFilter = selectedDate;
    if (timeRange === "month") state.dateFilter = selectedMonth;
    if (timeRange === "year") state.dateFilter = selectedYear;
    
    window.dispatchEvent(new CustomEvent("app-nav", { detail: { page: "users", state } }));
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const stats = [
    { icon: IndianRupee, label: "Total Revenue", value: `Rs ${data?.totalRevenue?.toLocaleString() ?? "0"}`, color: "text-orange-500", border: "border-orange-400", delay: 0, onClick: handleRevenueClick },
    { icon: Users, label: "Total Users", value: data?.totalUsers?.toLocaleString() ?? "0", color: "text-blue-600", border: "border-blue-400", delay: 100, onClick: () => handleUserClick("All") },
    { icon: UserCheck, label: "Active Users", value: data?.activeUsers?.toLocaleString() ?? "0", color: "text-green-600", border: "border-green-400", delay: 200, onClick: () => handleUserClick("Active") },
    { icon: CalendarCheck, label: "Pending Appointments", value: data?.pendingAppts ?? "0", color: "text-purple-600", border: "border-purple-400", delay: 300 },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-full">
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <div className="flex items-center gap-2 mt-1.5 opacity-80">
            <CalendarIcon size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              {timeRange === "day" ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) 
               : timeRange === "month" ? new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
               : timeRange === "year" ? selectedYear
               : timeRange === "all" ? "All Time"
               : today}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {timeRange === "day" && (
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all font-medium text-gray-700"
            />
          )}
          {timeRange === "month" && (
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all font-medium text-gray-700"
            />
          )}
          {timeRange === "year" && (
            <input 
              type="number" 
              min="2020" max="2100"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all font-medium text-gray-700 w-24"
            />
          )}
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all cursor-pointer pr-10"
            >
              <option value="day">Date</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center h-full py-40">
          <Loader2 size={40} className="animate-spin text-orange-400 mb-4" />
          <p className="text-sm font-medium text-gray-500 animate-pulse">Gathering insights...</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Charts Row 1: Revenue & Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue Trend */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <BarChart2 size={18} className="text-orange-500" />
                    Revenue Trend
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">Earnings across selected period</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data?.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                    formatter={(v) => [`Rs ${v.toLocaleString()}`, "Revenue"]} 
                    cursor={{ stroke: "#fb923c", strokeWidth: 1, strokeDasharray: "4 4" }} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    User Growth
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">Registration trajectory</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                    cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} 
                  />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={<CustomDot fill="#3b82f6" />} activeDot={{ r: 6, fill: "#1d4ed8" }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Analytics & Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Plan Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <h3 className="font-bold text-lg text-gray-900 mb-1">Plan Distribution</h3>
              <p className="text-xs font-medium text-gray-400 mb-6">Active subscription split</p>
              <div className="flex justify-center flex-1">
                <PieChart width={180} height={180}>
                  <Pie data={data?.planDist} cx={90} cy={90} innerRadius={56} outerRadius={86} paddingAngle={4} dataKey="value" stroke="none" animationDuration={1000}>
                    {data?.planDist.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} users (${props.payload.pct}%)`, name]} contentStyle={{borderRadius:8, border:"none", boxShadow:"0 4px 6px -1px rgb(0 0 0 / 0.1)"}}/>
                </PieChart>
              </div>
              <div className="space-y-3 mt-4">
                {data?.planDist.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: p.color }} />
                    <span className="text-sm font-semibold text-gray-700 flex-1">{p.name}</span>
                    <span className="text-sm font-bold text-gray-900 w-10 text-right">{p.value}</span>
                    <span className="text-xs font-medium text-gray-400 w-10 text-right bg-gray-50 py-0.5 rounded-md">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meals Logged */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg text-gray-900 mb-1">Meals Tracked</h3>
              <p className="text-xs font-medium text-gray-400 mb-6">Distribution by category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.mealCats} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6', opacity: 0.5}} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1200}>
                    {data?.mealCats.map((_, i) => <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <h3 className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-2"><Clock size={16} className="text-gray-400"/> Activity Feed</h3>
              <p className="text-xs font-medium text-gray-400 mb-6">Latest system actions</p>
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {(data?.activity ?? []).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${a.color} shadow-sm group-hover:scale-110 transition-transform`}>{a.initials}</div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                      <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{a.action}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-300 pt-1 shrink-0">{a.ago}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Add custom keyframes for animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
      `}} />
    </div>
  );
}
