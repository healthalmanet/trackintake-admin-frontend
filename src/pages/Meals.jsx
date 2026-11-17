import { useState, useEffect, useCallback } from "react";
import {
  Search, UtensilsCrossed, CheckCircle2, ChevronLeft,
  ChevronRight, RefreshCw, Flame, Loader2, Sparkles,
  ShieldCheck, Wheat
} from "lucide-react";
import { API_BASE_URL } from "../config";

const FODMAP_COLORS = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
  none: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Meals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fodmapFilter, setFodmapFilter] = useState("All");
  const [spiceFilter, setSpiceFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFoodItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: 20 });
      if (search) params.append("search", search);
      if (fodmapFilter && fodmapFilter !== "All") params.append("fodmap", fodmapFilter);
      if (spiceFilter && spiceFilter !== "All") params.append("spice", spiceFilter);
      if (verifiedFilter && verifiedFilter !== "All") params.append("verified", verifiedFilter);

      const res = await fetch(`${API_BASE_URL}/api/food-items/?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load food database");
      const data = await res.json();

      setItems(data.results || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || "Failed to load food catalog");
    } finally {
      setLoading(false);
    }
  }, [search, fodmapFilter, spiceFilter, verifiedFilter, page]);

  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Items & Nutritional Database</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse the verified USDA & Indian food database, macronutrient breakdowns, FODMAP classifications, and clinical attributes.
          </p>
        </div>
        <button
          onClick={fetchFoodItems}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-orange-500" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search food item name (e.g. Oats, Paneer, Rice)..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* FODMAP Filter */}
          <select
            value={fodmapFilter}
            onChange={(e) => { setFodmapFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All FODMAP Levels</option>
            <option value="Low">Low FODMAP</option>
            <option value="Medium">Medium FODMAP</option>
            <option value="High">High FODMAP</option>
          </select>

          {/* Spice Filter */}
          <select
            value={spiceFilter}
            onChange={(e) => { setSpiceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Spice Levels</option>
            <option value="None">Non-Spicy</option>
            <option value="Mild">Mild</option>
            <option value="Medium">Medium</option>
            <option value="Spicy">Spicy</option>
          </select>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Verification</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Food Items Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Loader2 size={28} className="animate-spin mx-auto text-orange-500 mb-2" />
          Loading nutritional records...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          No food items found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const fodmapLower = (item.fodmap_level || "none").toLowerCase();
            const fodmapBadge = FODMAP_COLORS[fodmapLower] || FODMAP_COLORS.none;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    {item.is_verified && (
                      <span className="shrink-0 p-1 text-green-600 bg-green-50 rounded-full" title="Verified Item">
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    Serving: {item.default_quantity} {item.default_unit}
                  </p>

                  {/* Nutrients Pills */}
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div className="bg-orange-50/70 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-orange-500 block">Calories</span>
                      <span className="text-xs font-bold text-gray-900">{Math.round(item.calories)}</span>
                      <span className="text-[9px] text-gray-400 block">kcal</span>
                    </div>

                    <div className="bg-blue-50/70 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-blue-500 block">Protein</span>
                      <span className="text-xs font-bold text-gray-900">{item.protein}</span>
                      <span className="text-[9px] text-gray-400 block">g</span>
                    </div>

                    <div className="bg-amber-50/70 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">Carbs</span>
                      <span className="text-xs font-bold text-gray-900">{item.carbs}</span>
                      <span className="text-[9px] text-gray-400 block">g</span>
                    </div>

                    <div className="bg-purple-50/70 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-purple-600 block">Fats</span>
                      <span className="text-xs font-bold text-gray-900">{item.fats}</span>
                      <span className="text-[9px] text-gray-400 block">g</span>
                    </div>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${fodmapBadge}`}>
                      FODMAP: {item.fodmap_level}
                    </span>
                    {item.spice_level && item.spice_level !== "None" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        🌶️ {item.spice_level}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-gray-400">
                    #{item.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-xs text-gray-500">
        <div>
          Showing <span className="font-semibold text-gray-800">{items.length}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalCount}</span> food items
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

