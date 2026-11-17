import { useState, useEffect, useCallback } from "react";
import { Utensils, Droplets, Scale, Search, Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles, Filter, RefreshCw } from "lucide-react";
import { getProgressLogs } from "../api/progress";

const MEAL_TYPE_BADGES = {
  breakfast: "bg-amber-50 text-amber-700 border-amber-200",
  lunch: "bg-orange-50 text-orange-700 border-orange-200",
  dinner: "bg-purple-50 text-purple-700 border-purple-200",
  snack: "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Progress() {
  const [activeTab, setActiveTab] = useState("meals"); // 'meals', 'water', 'weight'
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [summary, setSummary] = useState({ total_meals: 0, total_water: 0, total_weight: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [search]);

  // Reset page when tab or date changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, dateFilter]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProgressLogs({
        type: activeTab,
        search: debouncedSearch,
        date: dateFilter,
        page,
        page_size: 12,
      });

      if (data.summary) {
        setSummary(data.summary);
      }
      setLogs(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Progress logs error:", err);
      setLogs([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, dateFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Patient Progress & Logs</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Live patient health logs: Daily meals, hydration tracking, and body weight logs</p>
        </div>
        <button
          onClick={() => loadLogs()}
          className="self-start sm:self-auto p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-xs"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            id: "meals",
            label: "Meal Logs Recorded",
            value: summary.total_meals.toLocaleString(),
            icon: Utensils,
            color: "text-orange-500",
            bg: "bg-orange-50",
            border: "border-orange-400",
            sub: "Dietary entries logged by patients",
          },
          {
            id: "water",
            label: "Hydration Records",
            value: summary.total_water.toLocaleString(),
            icon: Droplets,
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-400",
            sub: "Water intake checkpoints logged",
          },
          {
            id: "weight",
            label: "Weight Check-ins",
            value: summary.total_weight.toLocaleString(),
            icon: Scale,
            color: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-400",
            sub: "Body weight milestone tracking",
          },
        ].map(({ id, label, value, icon: Icon, color, bg, border, sub }) => (
          <div
            key={id}
            onClick={() => setActiveTab(id)}
            className={`bg-white rounded-2xl border-t-[3px] ${border} border-x border-b border-gray-100 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
              activeTab === id ? "ring-2 ring-orange-400 ring-offset-2" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl md:text-3xl font-black ${color} mt-1.5 tracking-tight`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("meals")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === "meals" ? "bg-white text-orange-600 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Utensils size={15} />
              Meal Intake
            </button>
            <button
              onClick={() => setActiveTab("water")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === "water" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Droplets size={15} />
              Water Logs
            </button>
            <button
              onClick={() => setActiveTab("weight")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === "weight" ? "bg-white text-purple-600 shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Scale size={15} />
              Weight Tracking
            </button>
          </div>

          <span className="text-xs text-gray-400 font-medium">
            Showing {logs.length} of {totalCount} records
          </span>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "meals" ? "Search by patient name, email, or food item..." : "Search by patient name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 font-medium text-gray-700"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition cursor-pointer"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {activeTab === "meals" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Patient", "Meal Item", "Meal Type", "Portion & Calories", "Macronutrients", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400 text-sm animate-pulse">
                      Loading meal logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                      No meal logs found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((m) => {
                    const typeKey = m.meal_type?.toLowerCase();
                    const badgeClass = MEAL_TYPE_BADGES[typeKey] || MEAL_TYPE_BADGES.default;

                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900 block">{m.user_name}</span>
                          <span className="text-xs text-gray-500">{m.user_email || `User #${m.user_id}`}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-800">
                          {m.food_name || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${badgeClass}`}>
                            {m.meal_type || "Meal"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-extrabold text-orange-600 block">
                            {m.calories ? `${Math.round(m.calories)} kcal` : "—"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {m.quantity ? `${m.quantity} ${m.unit || "g"}` : "1 serving"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-bold">P: {m.protein ? `${m.protein}g` : "0g"}</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">C: {m.carbs ? `${m.carbs}g` : "0g"}</span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-bold">F: {m.fats ? `${m.fats}g` : "0g"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-gray-500">
                          {m.date || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === "water" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Patient", "Amount Consumed", "Status Progress", "Date Logged"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm animate-pulse">
                      Loading hydration records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                      No hydration logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((w) => (
                    <tr key={w.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-900 block">{w.user_name}</span>
                        <span className="text-xs text-gray-500">{w.user_email || `User #${w.user_id}`}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Droplets size={16} className="text-blue-500" />
                          <span className="font-black text-gray-900 text-base">{w.amount_ml} ml</span>
                          <span className="text-xs text-gray-400">({(w.amount_ml / 1000).toFixed(1)} L)</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          w.amount_ml >= 2000 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {w.amount_ml >= 2000 ? "✓ Daily Goal Met" : "In Progress"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-gray-500">
                        {w.date || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "weight" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {["Patient", "Recorded Weight", "Timestamp", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm animate-pulse">
                      Loading weight logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                      No weight check-ins found.
                    </td>
                  </tr>
                ) : (
                  logs.map((wg) => (
                    <tr key={wg.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-900 block">{wg.user_name}</span>
                        <span className="text-xs text-gray-500">{wg.user_email || `User #${wg.user_id}`}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Scale size={16} className="text-purple-500" />
                          <span className="font-black text-gray-900 text-base">{wg.weight_kg} kg</span>
                          <span className="text-xs text-gray-400">({(wg.weight_kg * 2.20462).toFixed(1)} lbs)</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {wg.time_logged ? new Date(wg.time_logged).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-gray-500">
                        {wg.date || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white text-xs text-gray-500 font-medium">
          <span>
            Showing {totalCount === 0 ? 0 : (page - 1) * 12 + 1}–{Math.min(page * 12, totalCount)} of {totalCount} logs
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
    </div>
  );
}

