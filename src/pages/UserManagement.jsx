import { useState, useEffect, useCallback } from "react";
import {
  Search, Eye, ChevronDown, Loader2, X, MapPin, Calendar, CheckCircle, XCircle,
  User, Heart, Stethoscope, CreditCard, CalendarCheck, Shield, Phone, Mail,
  ChevronLeft, ChevronRight, Save, Key, AlertCircle, Building, Star, Globe,
  Filter, RotateCcw, Copy, Check, Building2, Award, Sparkles, ShieldAlert, ShieldCheck, Ban,
  Crown, FileText, ExternalLink, Video, IndianRupee
} from "lucide-react";
import * as api from "../api/users";
import { API_BASE_URL } from "../config";

const CLOUDINARY_CLOUD_NAME = "dkcfeta0f";

function resolveDocUrl(url) {
  if (!url) return null;
  const str = String(url).trim();
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:")) {
    return str;
  }
  let clean = str;
  while (clean.startsWith("/")) clean = clean.slice(1);

  if (clean.startsWith("media/") || clean.startsWith("nutritionist/")) {
    const rawExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".zip"];
    const ext = clean.substring(clean.lastIndexOf(".")).toLowerCase();
    const resourceType = rawExtensions.includes(ext) ? "raw" : "image";
    const cloudPath = clean.startsWith("media/") ? clean : `media/${clean}`;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${cloudPath}`;
  }

  return `${API_BASE_URL}/${clean}`;
}

const ROLE_OPTIONS = ["All", "user", "inhouse", "expert", "nutritionist", "admin", "owner"];
const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const roleColor = {
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  nutritionist: "bg-purple-50 text-purple-700 border-purple-200",
  user: "bg-blue-50 text-blue-700 border-blue-200",
  owner: "bg-orange-50 text-orange-700 border-orange-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UserManagement({ pageState = {} }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [metrics, setMetrics] = useState({
    total_users: 0,
    total_patients: 0,
    total_nutritionists: 0,
    inhouse_nutritionists: 0,
    expert_nutritionists: 0,
    active_users: 0,
  });
  const PAGE_SIZE = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [dSearch, setDSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(pageState.role || "All");
  const [statusFilter, setStatusFilter] = useState(pageState.statusFilter || "All");
  const [dateFilterMode, setDateFilterMode] = useState("date");
  const [dateFilter, setDateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Detail Modal
  const [detailUser, setDetailUser] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const handleToggleUserStatus = async (user, e) => {
    if (e) e.stopPropagation();
    const action = user.is_active ? "block login access for" : "activate and restore login access for";
    if (!window.confirm(`Are you sure you want to ${action} "${user.full_name || user.email || 'this user'}"?`)) {
      return;
    }

    setTogglingUserId(user.id);
    try {
      const res = await api.toggleUserStatus(user.id, !user.is_active);
      setActionFeedback({
        type: "success",
        message: res.message || `Account for "${user.full_name || 'user'}" has been ${user.is_active ? "blocked" : "activated"}.`
      });
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
      setMetrics(prev => ({
        ...prev,
        active_users: user.is_active ? Math.max(0, prev.active_users - 1) : prev.active_users + 1
      }));
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to update user account status"
      });
    } finally {
      setTogglingUserId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => { setDSearch(search); setPage(1); }, 350);
    return () => clearTimeout(h);
  }, [search]);

  useEffect(() => {
    if (pageState?.role) setRoleFilter(pageState.role);
    if (pageState?.statusFilter) setStatusFilter(pageState.statusFilter);
  }, [pageState]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = { search: dSearch, role: roleFilter, status: statusFilter };
      if (cityFilter) filters.city = cityFilter;
      if (dateFilter) {
        if (dateFilterMode === "date") filters.date = dateFilter;
        else if (dateFilterMode === "month") { const [y, m] = dateFilter.split("-"); filters.month = m; filters.year = y; }
        else if (dateFilterMode === "year") filters.year = dateFilter;
      }
      const data = await api.getUsers(filters, page, PAGE_SIZE);
      setUsers(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dSearch, page, roleFilter, statusFilter, dateFilter, dateFilterMode, cityFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const activeCount = users.filter(u => u.is_active).length;
  const isFiltered = search || cityFilter || dateFilter || roleFilter !== "All" || statusFilter !== "All";

  const resetFilters = () => {
    setSearch("");
    setDSearch("");
    setCityFilter("");
    setDateFilter("");
    setRoleFilter("All");
    setStatusFilter("All");
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {detailUser && (
        <UserDetailModal
          userId={detailUser.id}
          onClose={() => { setDetailUser(null); fetchUsers(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-blue-100/80 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5">
              <User size={12} /> Directory & Access Control
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {totalCount} Accounts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            360° health profiles, practitioner credentials, subscription allocations & security controls
          </p>
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} /> Clear Filters
          </button>
        )}
      </div>

      {actionFeedback && (
        <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs ${
          actionFeedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? <CheckCircle size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="p-1 hover:bg-black/5 rounded-lg cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Relevant & Interactive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          {
            label: "Total Accounts",
            value: metrics.total_users || totalCount,
            sub: "Click to view all",
            color: "text-slate-900",
            icon: User,
            bg: "bg-slate-100 text-slate-700",
            border: "border-slate-200/80",
            active: roleFilter === "All" && statusFilter === "All",
            onClick: () => { setRoleFilter("All"); setStatusFilter("All"); setPage(1); }
          },
          {
            label: "Patients Base",
            value: metrics.total_patients || 0,
            sub: "Health tracking users",
            color: "text-blue-600",
            icon: Heart,
            bg: "bg-blue-50 text-blue-600",
            border: "border-blue-200",
            active: roleFilter === "user",
            onClick: () => { setRoleFilter("user"); setPage(1); }
          },
          {
            label: "In-House Consultants",
            value: metrics.inhouse_nutritionists || 0,
            sub: "Internal team clinicians",
            color: "text-sky-600",
            icon: Building2,
            bg: "bg-sky-50 text-sky-600",
            border: "border-sky-200",
            active: roleFilter === "inhouse",
            onClick: () => { setRoleFilter("inhouse"); setPage(1); }
          },
          {
            label: "Expert Specialists",
            value: metrics.expert_nutritionists || 0,
            sub: "External specialist network",
            color: "text-purple-600",
            icon: Award,
            bg: "bg-purple-50 text-purple-600",
            border: "border-purple-200",
            active: roleFilter === "expert",
            onClick: () => { setRoleFilter("expert"); setPage(1); }
          },
          {
            label: "Active Accounts",
            value: metrics.active_users || totalCount,
            sub: `${Math.max(0, (metrics.total_users || totalCount) - (metrics.active_users || totalCount))} suspended`,
            color: "text-emerald-600",
            icon: CheckCircle,
            bg: "bg-emerald-50 text-emerald-600",
            border: "border-emerald-200",
            active: statusFilter === "Active",
            onClick: () => { setStatusFilter("Active"); setPage(1); }
          },
        ].map(({ label, value, sub, color, icon: Icon, bg, border, active, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`bg-white rounded-2xl border p-4 md:p-5 shadow-xs transition hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer ${
              active ? `${border} ring-2 ring-orange-500/20 shadow-md` : "border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>
              {loading ? "—" : typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* Role Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter By Role:</span>
        {[
          { id: "All", label: "All Users" },
          { id: "user", label: "👤 Patients Only" },
          { id: "inhouse", label: "🏢 In-House Consultants" },
          { id: "expert", label: "🌟 Expert Consultants" },
          { id: "nutritionist", label: "🧑‍⚕️ All Nutritionists" },
          { id: "admin", label: "🛡️ Administrators" },
          { id: "owner", label: "👑 System Owners" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setRoleFilter(tab.id); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              roleFilter === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 md:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 focus:bg-white transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* City */}
            <div className="relative flex-1 sm:flex-none min-w-[130px]">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="City..."
                value={cityFilter}
                onChange={e => { setCityFilter(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 transition"
              />
            </div>

            {/* Date filter selector */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
              <select
                value={dateFilterMode}
                onChange={e => { setDateFilterMode(e.target.value); setDateFilter(""); }}
                className="bg-slate-100 border-r border-slate-200 text-xs font-bold px-2.5 py-2 text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <input
                type={dateFilterMode === "year" ? "number" : dateFilterMode}
                min={dateFilterMode === "year" ? "2020" : undefined}
                max={dateFilterMode === "year" ? "2100" : undefined}
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setPage(1); }}
                placeholder={dateFilterMode === "year" ? "YYYY" : undefined}
                className="pl-2.5 pr-3 py-2 text-xs md:text-sm bg-transparent focus:outline-none text-slate-700 w-28"
              />
            </div>

            {/* Role dropdown */}
            <div className="relative min-w-[125px]">
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs md:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 cursor-pointer text-slate-700"
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o} value={o}>
                    {o === "All" ? "All Roles" :
                     o === "user" ? "👤 Patients" :
                     o === "inhouse" ? "🏢 In-House Consultants" :
                     o === "expert" ? "🌟 Expert Consultants" :
                     o === "nutritionist" ? "🧑‍⚕️ All Nutritionists" :
                     o === "admin" ? "🛡️ Administrators" :
                     o === "owner" ? "👑 System Owners" : o}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Status dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs md:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 cursor-pointer text-slate-700"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o} value={o}>{o === "All" ? "All Status" : o}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table (Desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hidden md:flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Account Role</th>
                <th className="px-5 py-3.5">Access Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-orange-500 mx-auto mb-2" />
                    <span className="text-xs font-semibold">Loading user accounts...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-rose-500 text-xs font-bold">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-400 text-xs font-medium">
                    No users match the current search or filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initials = (user.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-400 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate group-hover:text-orange-600 transition-colors">
                              {user.full_name || "Unknown"}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              ID #{user.id} {user.city && `· ${user.city}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 text-xs block font-medium truncate max-w-[200px]">
                            {user.email || "—"}
                          </span>
                          {user.phone_number && (
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone size={10} /> {user.phone_number}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold capitalize border ${roleColor[user.role] || roleColor.default}`}>
                            {user.role || "user"}
                          </span>
                          {user.role === "nutritionist" && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                              user.nutritionist_type === "expert"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-sky-100 text-sky-700"
                            }`}>
                              {user.nutritionist_type === "expert" ? "⭐ Specialist" : "🏢 In-House"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                          {user.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                        {fmt(user.date_joined)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} /> View & Edit
                          </button>
                          <button
                            onClick={(e) => handleToggleUserStatus(user, e)}
                            disabled={togglingUserId === user.id}
                            title={user.is_active ? "Block user & disable login access" : "Activate user & restore login access"}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer shadow-2xs disabled:opacity-50 ${
                              user.is_active
                                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            {togglingUserId === user.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : user.is_active ? (
                              <Ban size={13} />
                            ) : (
                              <ShieldCheck size={13} />
                            )}
                            <span>{user.is_active ? "Block" : "Activate"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/50">
          <span>
            Showing {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 font-bold text-slate-700">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
            No accounts found.
          </div>
        ) : (
          users.map((user) => {
            const initials = (user.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={user.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-400 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{user.full_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email || "—"}</p>
                      {user.phone_number && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.phone_number}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                    user.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                  }`}>
                    {user.is_active ? "Active" : "Blocked"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${roleColor[user.role] || roleColor.default}`}>
                    {user.role || "user"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleUserStatus(user, e)}
                      disabled={togglingUserId === user.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                        user.is_active
                          ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                      }`}
                    >
                      {togglingUserId === user.id ? <Loader2 size={11} className="animate-spin" /> : user.is_active ? <Ban size={11} /> : <ShieldCheck size={11} />}
                      {user.is_active ? "Block" : "Activate"}
                    </button>
                    <button
                      onClick={() => setDetailUser(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Eye size={12} /> View & Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 360° USER DETAIL MODAL ──────────────────────────────────────────────────
const TABS = [
  { id: "account", label: "Account Profile", icon: User },
  { id: "health", label: "Health & Vitals", icon: Heart },
  { id: "clinician", label: "Practitioner Credentials", icon: Stethoscope },
  { id: "subscriptions", label: "Billing & Plans", icon: CreditCard },
  { id: "appointments", label: "Consultation History", icon: CalendarCheck },
  { id: "security", label: "Security & Passwords", icon: Shield },
];

function Field({ label, value, edit, onChange, type = "text", options }) {
  if (!edit) return (
    <div className="bg-slate-50/80 rounded-2xl px-4 py-3 border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm md:text-base font-bold text-slate-800 break-words">{value || "—"}</p>
    </div>
  );
  if (options) return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-semibold text-slate-800 cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </div>
  );
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-semibold text-slate-800"
      />
    </div>
  );
}

function BoolField({ label, value, edit, onChange }) {
  if (!edit) return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-bold ${
      value ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-100"
    }`}>
      {value ? <Check size={16} className="text-emerald-600" /> : <X size={16} className="text-slate-400" />}
      <span>{label}</span>
    </div>
  );
  return (
    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
      />
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgType, setSaveMsgType] = useState("success");
  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUser(userId)
      .then(d => {
        const u = d.user || d || {};
        const normalized = {
          ...d,
          ...u,
          id: u.id || d.id || userId,
          full_name: u.full_name || d.full_name || "",
          email: u.email || d.email || "",
          phone_number: u.phone_number || d.phone_number || "",
          role: u.role || d.role || "user",
          is_active: u.is_active !== undefined ? u.is_active : (d.is_active !== undefined ? d.is_active : true),
          date_joined: u.date_joined || d.date_joined,
          last_login: u.last_login || d.last_login,
          plan: u.plan || d.plan || "",
          nutritionist_type: u.nutritionist_type || d.nutritionist_type || "",
          city: u.city || d.city || (d.health_profile && d.health_profile.city) || "",
          country: u.country || d.country || (d.health_profile && d.health_profile.country) || "",
          health_profile: d.health_profile || u.health_profile || null,
          nutritionist_profile: d.nutritionist_profile || u.nutritionist_profile || null,
          subscriptions: d.subscriptions || u.subscriptions || [],
          active_subscription: d.active_subscription || (d.subscriptions && d.subscriptions.find(s => s.is_active)) || null,
          payments: d.payments || u.payments || [],
          appointments: d.appointments || u.appointments || [],
        };
        setData(normalized);
        setForm(flattenForForm(normalized));
      })
      .catch((err) => {
        console.error("Failed to load user details:", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  function flattenForForm(d) {
    if (!d) return {};
    const u = d.user || d;
    const hp = d.health_profile || u.health_profile || {};
    const np = d.nutritionist_profile || u.nutritionist_profile || {};
    return {
      full_name: u.full_name || d.full_name || "",
      email: u.email || d.email || "",
      phone_number: u.phone_number || d.phone_number || "",
      role: u.role || d.role || "user",
      is_active: u.is_active !== undefined ? u.is_active : (d.is_active !== undefined ? d.is_active : true),
      plan: u.plan || d.plan || "",
      nutritionist_type: u.nutritionist_type || d.nutritionist_type || "",
      // health
      height_cm: hp.height_cm !== null && hp.height_cm !== undefined ? hp.height_cm : "",
      weight_kg: hp.weight_kg !== null && hp.weight_kg !== undefined ? hp.weight_kg : "",
      gender: hp.gender || "",
      date_of_birth: hp.date_of_birth || "",
      activity_level: hp.activity_level || "",
      goal: hp.goal || "",
      diet_type: hp.diet_type || "",
      allergies: hp.allergies || "",
      city: hp.city || d.city || u.city || "",
      country: hp.country || d.country || u.country || "",
      occupation: hp.occupation || "",
      is_diabetic: !!hp.is_diabetic,
      is_hypertensive: !!hp.is_hypertensive,
      has_heart_condition: !!hp.has_heart_condition,
      has_thyroid_disorder: !!hp.has_thyroid_disorder,
      has_arthritis: !!hp.has_arthritis,
      has_gastric_issues: !!hp.has_gastric_issues,
      is_pregnant: !!hp.is_pregnant,
      is_breastfeeding: !!hp.is_breastfeeding,
      other_chronic_condition: hp.other_chronic_condition || "",
      family_history: hp.family_history || "",
      // nutritionist
      professional_title: np.professional_title || "",
      professional_bio: np.professional_bio || "",
      years_of_experience: np.years_of_experience || "",
      qualification: np.qualification || "",
      registration_number: np.registration_number || "",
      current_organization: np.current_organization || "",
      online_price: np.online_price || "",
      offline_price: np.offline_price || "",
      is_verified: !!np.is_verified,
    };
  }

  const f = (key) => form[key];
  const setF = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        role: form.role,
        is_active: form.is_active,
        plan: form.plan,
        nutritionist_type: form.nutritionist_type,
        health_profile: {
          height_cm: form.height_cm, weight_kg: form.weight_kg,
          gender: form.gender, date_of_birth: form.date_of_birth,
          activity_level: form.activity_level, goal: form.goal,
          diet_type: form.diet_type, allergies: form.allergies,
          city: form.city, country: form.country, occupation: form.occupation,
          is_diabetic: form.is_diabetic, is_hypertensive: form.is_hypertensive,
          has_heart_condition: form.has_heart_condition, has_thyroid_disorder: form.has_thyroid_disorder,
          has_arthritis: form.has_arthritis, has_gastric_issues: form.has_gastric_issues,
          is_pregnant: form.is_pregnant, is_breastfeeding: form.is_breastfeeding,
          other_chronic_condition: form.other_chronic_condition, family_history: form.family_history,
        },
        nutritionist_profile: {
          professional_title: form.professional_title, professional_bio: form.professional_bio,
          years_of_experience: form.years_of_experience, qualification: form.qualification,
          registration_number: form.registration_number, current_organization: form.current_organization,
          online_price: form.online_price, offline_price: form.offline_price,
        },
      };
      await api.updateUser(userId, payload);
      setSaveMsg("Changes saved successfully!"); setSaveMsgType("success");
      setEditing(false);
      try {
        const fresh = await api.getUser(userId);
        const u = fresh.user || fresh || {};
        const normalized = {
          ...fresh,
          ...u,
          id: u.id || fresh.id || userId,
          full_name: u.full_name || fresh.full_name || "",
          email: u.email || fresh.email || "",
          phone_number: u.phone_number || fresh.phone_number || "",
          role: u.role || fresh.role || "user",
          is_active: u.is_active !== undefined ? u.is_active : true,
          date_joined: u.date_joined || fresh.date_joined,
          last_login: u.last_login || fresh.last_login,
          plan: u.plan || fresh.plan || "",
          nutritionist_type: u.nutritionist_type || fresh.nutritionist_type || "",
          city: u.city || fresh.city || (fresh.health_profile && fresh.health_profile.city) || "",
          country: u.country || fresh.country || (fresh.health_profile && fresh.health_profile.country) || "",
          health_profile: fresh.health_profile || u.health_profile || null,
          nutritionist_profile: fresh.nutritionist_profile || u.nutritionist_profile || null,
          subscriptions: fresh.subscriptions || u.subscriptions || [],
          payments: fresh.payments || u.payments || [],
          appointments: fresh.appointments || u.appointments || [],
        };
        setData(normalized);
        setForm(flattenForForm(normalized));
      } catch {
        // fallback
      }
    } catch (err) {
      setSaveMsg(err.message || "Failed to save updates"); setSaveMsgType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const handleToggleActive = async () => {
    if (!data) return;
    const isCurrentlyActive = !!data.is_active;
    const action = isCurrentlyActive ? "block login access for" : "unblock and restore login access for";
    if (!window.confirm(`Are you sure you want to ${action} "${data.full_name || 'this user'}"?`)) {
      return;
    }

    setTogglingStatus(true);
    setSaveMsg("");
    try {
      const res = await api.toggleUserStatus(userId, !isCurrentlyActive);
      const newStatus = !isCurrentlyActive;
      setData(prev => ({ ...prev, is_active: newStatus }));
      setForm(prev => ({ ...prev, is_active: newStatus }));
      setSaveMsg(res.message || (newStatus ? "Account activated and login access restored." : "Account disabled and login access blocked."));
      setSaveMsgType(newStatus ? "success" : "error");
    } catch (err) {
      setSaveMsg(err.message || "Failed to update account status");
      setSaveMsgType("error");
    } finally {
      setTogglingStatus(false);
      setTimeout(() => setSaveMsg(""), 5000);
    }
  };

  const handlePasswordReset = async () => {
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) { setPwMsg("Password must be at least 6 characters"); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg("Passwords do not match"); return; }
    setPwSaving(true); setPwMsg("");
    try {
      await api.resetPassword(userId, pwForm.newPassword, pwForm.confirm);
      setPwMsg("✓ Password reset successfully!"); setPwForm({ newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg("✗ " + (err.message || "Failed to reset password"));
    } finally {
      setPwSaving(false);
    }
  };

  const visibleTabs = TABS.filter(t => {
    if (t.id === "clinician" && data?.role !== "nutritionist") return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 size={42} className="animate-spin text-orange-500" />
            <p className="text-sm font-bold text-slate-500 mt-4">Loading 360° user profile...</p>
          </div>
        ) : !data ? (
          <div className="p-16 text-center text-rose-500 font-bold text-base">Failed to load user profile.</div>
        ) : (
          <>
            {/* Top Identity Header */}
            <div className="flex items-center gap-4 sm:gap-5 p-6 md:p-7 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-orange-500/20 shrink-0">
                {(data.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{data.full_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border shadow-2xs ${roleColor[data.role] || roleColor.default}`}>
                    {data.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                    data.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}>
                    {data.is_active ? "Active · Login Allowed" : "Blocked · Login Disabled"}
                  </span>
                  {data.role === "nutritionist" && data.nutritionist_profile && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                      data.nutritionist_profile.is_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {data.nutritionist_profile.is_verified ? "✓ Verified Staff" : "⏳ Pending Review"}
                    </span>
                  )}
                  {data.active_subscription && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs flex items-center gap-1.5">
                      <Crown size={13} className="text-amber-500" />
                      {data.active_subscription.plan_name} (₹{data.active_subscription.price})
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1 truncate font-medium">
                  {data.email} · ID #{data.id}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={togglingStatus}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 ${
                    data.is_active
                      ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  {togglingStatus ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : data.is_active ? (
                    <Ban size={14} />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  <span>{data.is_active ? "Block Login Access" : "Unblock Account"}</span>
                </button>

                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-500/20 transition cursor-pointer"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditing(false); setForm(flattenForForm(data)); }}
                      className="px-4 py-2 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Close modal"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {!data.is_active && (
              <div className="mx-6 sm:mx-8 mt-4 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                  <div>
                    <p className="font-extrabold text-rose-900">Account is Deactivated & Login Access is Blocked</p>
                    <p className="font-normal text-rose-700 text-xs mt-0.5">
                      This user cannot log in to TrackIntake. All authentication attempts will be rejected.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={togglingStatus}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} /> Restore Login Access
                </button>
              </div>
            )}

            {saveMsg && (
              <div className={`mx-6 sm:mx-8 mt-4 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 ${
                saveMsgType === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}>
                {saveMsgType === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />} {saveMsg}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto shrink-0 bg-white px-6">
              {visibleTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition cursor-pointer ${
                    activeTab === id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* ACCOUNT TAB */}
              {activeTab === "account" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Account Credentials & Roles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Full Name" value={f("full_name")} edit={editing} onChange={setF("full_name")} />
                    <Field label="Email Address" value={f("email")} edit={editing} onChange={setF("email")} type="email" />
                    <Field label="Phone Number" value={f("phone_number")} edit={editing} onChange={setF("phone_number")} />
                    <Field label="Role" value={f("role")} edit={editing} onChange={setF("role")}
                      options={["user", "nutritionist", "admin", "owner"]} />
                    <Field label="Plan Tier" value={f("plan")} edit={editing} onChange={setF("plan")} />
                    <Field label="Account & Login Status" value={f("is_active") ? "Active (Login Allowed)" : "Blocked (Login Denied)"} edit={editing}
                      onChange={v => setF("is_active")(v.startsWith("Active"))} options={["Active (Login Allowed)", "Blocked (Login Denied)"]} />
                  </div>

                  {data.role === "nutritionist" && (
                    <div className="pt-2">
                      <h3 className="text-xs font-extrabold text-purple-600 uppercase tracking-wider mb-2">Nutritionist Tier Classification</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Consultant Type" value={f("nutritionist_type")} edit={editing}
                          onChange={setF("nutritionist_type")} options={["", "inhouse", "expert"]} />
                        <Field label="Verification Status" value={data.nutritionist_profile?.is_verified ? "Verified Professional" : "Unverified"} />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
                      <span className="font-semibold text-slate-700">{fmt(data.date_joined)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Active Session</span>
                      <span className="font-semibold text-slate-700">{fmt(data.last_login)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* HEALTH TAB */}
              {activeTab === "health" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Physical Metrics & Dietary Profile</h3>
                  {!data.health_profile ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center">
                      <Heart size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No medical profile completed</p>
                      <p className="text-xs text-slate-400 mt-1">User has not submitted their health questionnaire yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field label="Height (cm)" value={f("height_cm")} edit={editing} onChange={setF("height_cm")} type="number" />
                        <Field label="Weight (kg)" value={f("weight_kg")} edit={editing} onChange={setF("weight_kg")} type="number" />
                        <Field label="Gender" value={f("gender")} edit={editing} onChange={setF("gender")} options={["", "male", "female", "other"]} />
                        <Field label="Date of Birth" value={f("date_of_birth")} edit={editing} onChange={setF("date_of_birth")} type="date" />
                        <Field label="Activity Level" value={f("activity_level")} edit={editing} onChange={setF("activity_level")}
                          options={["", "sedentary", "lightly_active", "moderately_active", "very_active", "super_active"]} />
                        <Field label="Health Goal" value={f("goal")} edit={editing} onChange={setF("goal")}
                          options={["", "weight_loss", "weight_gain", "maintain", "muscle_gain"]} />
                        <Field label="Dietary Preference" value={f("diet_type")} edit={editing} onChange={setF("diet_type")}
                          options={["", "veg", "non-veg", "vegan", "eggetarian"]} />
                        <Field label="Allergies" value={f("allergies")} edit={editing} onChange={setF("allergies")} />
                        <Field label="City" value={f("city")} edit={editing} onChange={setF("city")} />
                        <Field label="Country" value={f("country")} edit={editing} onChange={setF("country")} />
                        <Field label="Occupation" value={f("occupation")} edit={editing} onChange={setF("occupation")} />
                      </div>

                      <div className="pt-2">
                        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Chronic Conditions & Symptoms</h4>
                        <div className={`grid gap-2 ${editing ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                          {[
                            ["Diabetic", "is_diabetic"], ["Hypertensive", "is_hypertensive"],
                            ["Heart Condition", "has_heart_condition"], ["Thyroid Disorder", "has_thyroid_disorder"],
                            ["Arthritis", "has_arthritis"], ["Gastric Issues", "has_gastric_issues"],
                            ["Pregnant", "is_pregnant"], ["Breastfeeding", "is_breastfeeding"],
                          ].map(([label, key]) => (
                            <BoolField key={key} label={label} value={f(key)} edit={editing} onChange={setF(key)} />
                          ))}
                        </div>
                      </div>

                      {(f("other_chronic_condition") || editing) && (
                        <Field label="Other Chronic Conditions" value={f("other_chronic_condition")} edit={editing} onChange={setF("other_chronic_condition")} />
                      )}
                      {(f("family_history") || editing) && (
                        <Field label="Family Medical History" value={f("family_history")} edit={editing} onChange={setF("family_history")} />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* CLINICIAN TAB */}
              {activeTab === "clinician" && (
                <div className="space-y-5">
                  {!data.nutritionist_profile ? (
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-8 text-center">
                      <Stethoscope size={32} className="text-purple-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No clinician profile record</p>
                    </div>
                  ) : (
                    <>
                      {/* Practitioner Verification Audit Banner */}
                      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-sm ${
                        data.nutritionist_profile.is_verified
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-amber-50/70 border-amber-200 text-amber-900"
                      }`}>
                        <div className="flex items-center gap-2.5 font-bold">
                          {data.nutritionist_profile.is_verified ? (
                            <ShieldCheck size={20} className="text-emerald-600" />
                          ) : (
                            <ShieldAlert size={20} className="text-amber-600" />
                          )}
                          <span>Audit Verification Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                            data.nutritionist_profile.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {data.nutritionist_profile.is_verified ? "✓ Verified Practitioner" : "⏳ Pending Verification"}
                          </span>
                        </div>
                        {data.nutritionist_profile.verified_at && (
                          <span className="text-xs text-slate-500 font-medium">
                            Verified on: <strong className="text-slate-700">{fmt(data.nutritionist_profile.verified_at)}</strong>
                          </span>
                        )}
                      </div>

                      {/* Quick Clinical Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Experience</span>
                          <strong className="text-lg font-black text-slate-900 mt-0.5 block">{data.nutritionist_profile.years_of_experience || 0} Years</strong>
                          <span className="text-[11px] text-slate-500">Practicing clinician</span>
                        </div>
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Patients</span>
                          <strong className="text-lg font-black text-blue-600 mt-0.5 block">{data.nutritionist_profile.assigned_patients_count || 0} Patients</strong>
                          <span className="text-[11px] text-slate-500">Active caseload</span>
                        </div>
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultations Delivered</span>
                          <strong className="text-lg font-black text-emerald-600 mt-0.5 block">{data.nutritionist_profile.total_appointments_count || 0} Sessions</strong>
                          <span className="text-[11px] text-slate-500">Completed bookings</span>
                        </div>
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Registration</span>
                          <strong className="text-sm font-mono font-black text-slate-900 mt-0.5 block truncate">
                            {data.nutritionist_profile.registration_number || "Not on file"}
                          </strong>
                          <span className="text-[11px] text-slate-500 truncate block">Council: {data.nutritionist_profile.issuing_authority || "Medical Authority"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Professional Title" value={f("professional_title")} edit={editing} onChange={setF("professional_title")} />
                        <Field label="Degree / Qualification" value={f("qualification")} edit={editing} onChange={setF("qualification")} />
                        <Field label="Experience (Years)" value={f("years_of_experience")} edit={editing} onChange={setF("years_of_experience")} type="number" />
                        <Field label="Registration / License #" value={f("registration_number")} edit={editing} onChange={setF("registration_number")} />
                        <Field label="Issuing Authority / Council" value={f("issuing_authority")} edit={editing} onChange={setF("issuing_authority")} />
                        <Field label="Current Clinic / Hospital" value={f("current_organization")} edit={editing} onChange={setF("current_organization")} />
                        <Field label="Practice Location" value={f("offline_location")} edit={editing} onChange={setF("offline_location")} />
                        <Field label="Model Type" value={f("nutritionist_type")} edit={editing} onChange={setF("nutritionist_type")} options={["inhouse", "expert"]} />
                      </div>

                      {/* Specializations & Languages */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Clinical Specializations</p>
                          {data.nutritionist_profile.specializations && data.nutritionist_profile.specializations.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {data.nutritionist_profile.specializations.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[11px] font-bold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">None specified</p>
                          )}
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Languages Spoken</p>
                          {data.nutritionist_profile.languages_spoken && data.nutritionist_profile.languages_spoken.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {data.nutritionist_profile.languages_spoken.map((l, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                                  {l}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">None specified</p>
                          )}
                        </div>
                      </div>

                      {editing ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Professional Bio</label>
                          <textarea
                            value={f("professional_bio")}
                            onChange={e => setF("professional_bio")(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-medium"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Bio</p>
                          <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                            {data.nutritionist_profile.professional_bio || "—"}
                          </p>
                        </div>
                      )}

                      {data.nutritionist_profile.additional_certifications && (
                        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Additional Certifications & Fellowships</p>
                          <p className="text-xs md:text-sm text-slate-700 font-medium">
                            {data.nutritionist_profile.additional_certifications}
                          </p>
                        </div>
                      )}

                      {/* Practice Channels & Fees */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <Video size={14} className="text-blue-600" /> Online Telehealth
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              data.nutritionist_profile.is_online_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
                            }`}>
                              {data.nutritionist_profile.is_online_available ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-400 font-medium block">Current Rate:</span>
                            <strong className="text-lg font-black text-slate-900">₹{data.nutritionist_profile.online_price || 0}</strong>
                            <p className="text-[11px] text-slate-500 mt-0.5">Mode: {data.nutritionist_profile.is_virtual_enabled ? "Video & Chat Enabled" : "Chat/Audio"}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <Building2 size={14} className="text-purple-600" /> In-Clinic Physical Practice
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              data.nutritionist_profile.is_offline_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
                            }`}>
                              {data.nutritionist_profile.is_offline_available ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-400 font-medium block">Current Rate:</span>
                            <strong className="text-lg font-black text-slate-900">₹{data.nutritionist_profile.offline_price || 0}</strong>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">Location: {data.nutritionist_profile.offline_location || "Clinic address on record"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pending Price Request if any */}
                      {(data.nutritionist_profile.pending_online_price || data.nutritionist_profile.pending_offline_price) && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-purple-900 block">Pending Rate Revision Request:</span>
                            <span className="text-purple-700">
                              Online: ₹{data.nutritionist_profile.pending_online_price ?? data.nutritionist_profile.online_price} · In-Clinic: ₹{data.nutritionist_profile.pending_offline_price ?? data.nutritionist_profile.offline_price}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-purple-200 text-purple-800 font-bold rounded-lg text-[11px]">
                            Review Pending
                          </span>
                        </div>
                      )}

                      {/* Submitted Verification Documents */}
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Official Verification Credentials & Documents</h4>
                          <span className="text-xs font-bold text-slate-500">
                            {[
                              data.nutritionist_profile.government_id || data.nutritionist_profile.documents?.government_id,
                              data.nutritionist_profile.qualification_certificate || data.nutritionist_profile.documents?.qualification_certificate,
                              data.nutritionist_profile.registration_certificate || data.nutritionist_profile.documents?.registration_certificate,
                              data.nutritionist_profile.experience_certificate || data.nutritionist_profile.documents?.experience_certificate,
                            ].filter(Boolean).length} of 4 Uploaded
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { label: "Government Photo ID Document", url: data.nutritionist_profile.government_id || data.nutritionist_profile.documents?.government_id },
                            { label: "Degree Qualification Certificate", url: data.nutritionist_profile.qualification_certificate || data.nutritionist_profile.documents?.qualification_certificate },
                            { label: "Medical Council Registration", url: data.nutritionist_profile.registration_certificate || data.nutritionist_profile.documents?.registration_certificate },
                            { label: "Clinical Experience Proof", url: data.nutritionist_profile.experience_certificate || data.nutritionist_profile.documents?.experience_certificate },
                          ].map(({ label, url }) => {
                            const resolved = resolveDocUrl(url);
                            return (
                              <div
                                key={label}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                                  resolved ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-50/70 border-slate-200/60"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      resolved ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-400"
                                    }`}>
                                      <FileText size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 leading-tight">{label}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    resolved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
                                  }`}>
                                    {resolved ? "✓ Uploaded" : "Missing"}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                  {resolved ? (
                                    <a
                                      href={resolved}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 transition cursor-pointer"
                                    >
                                      View Document <ExternalLink size={13} />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">No document file on file</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SUBSCRIPTIONS TAB */}
              {activeTab === "subscriptions" && (
                <div className="space-y-6">
                  {/* Active Subscription Banner */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Active Subscription Status</h3>
                    {data.active_subscription ? (
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border border-amber-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                              <Crown size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black text-slate-900">{data.active_subscription.plan_name}</h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Running Active
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 capitalize">
                                  {data.active_subscription.plan_type || "Plan"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Validity: <strong className="text-slate-700">{fmt(data.active_subscription.start_date)}</strong> → <strong className="text-slate-700">{fmt(data.active_subscription.end_date)}</strong>
                                {data.active_subscription.duration_days > 0 && ` (${data.active_subscription.duration_days} Days)`}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Plan Fee</span>
                            <strong className="text-2xl font-black text-slate-900">₹{data.active_subscription.price}</strong>
                          </div>
                        </div>

                        {/* Quotas & Limits */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Max Patients Allowed</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                              {data.active_subscription.nutri_max_patients !== undefined && data.active_subscription.nutri_max_patients !== null
                                ? (data.active_subscription.nutri_max_patients === 0 ? "Unlimited / Platform Default" : `${data.active_subscription.nutri_max_patients} Patients`)
                                : "Standard Quota"}
                            </p>
                          </div>
                          <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">In-House Consults Remaining</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                              {data.active_subscription.remaining_inhouse ?? "—"}
                            </p>
                          </div>
                          <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Expert Consults Remaining</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                              {data.active_subscription.remaining_expert ?? "—"}
                            </p>
                          </div>
                        </div>

                        {/* Granted Features */}
                        {data.active_subscription.features && (
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Granted Feature Privileges</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: "AI Diet Plans", enabled: data.active_subscription.features.ai_diet },
                                { label: "Manual Diet Plans", enabled: data.active_subscription.features.manual_diet },
                                { label: "Chat Support", enabled: data.active_subscription.features.chat },
                                { label: "Online Telehealth", enabled: data.active_subscription.features.online_appointment },
                                { label: "In-Clinic Visits", enabled: data.active_subscription.features.offline_appointment },
                              ].map((feat, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                                    feat.enabled
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-slate-100 text-slate-400 border-slate-200"
                                  }`}
                                >
                                  <span>{feat.enabled ? "✓" : "✕"}</span>
                                  <span>{feat.label}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
                        <CreditCard size={36} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No active subscriptions</p>
                        <p className="text-xs text-slate-400 mt-1">This user is currently on the free tier or has an expired subscription.</p>
                      </div>
                    )}
                  </div>

                  {/* All Subscriptions History Table */}
                  {data.subscriptions && data.subscriptions.length > 0 && (
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">All Subscriptions ({data.subscriptions.length})</h3>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="p-3">Plan Name</th>
                              <th className="p-3">Price</th>
                              <th className="p-3">Start Date</th>
                              <th className="p-3">End Date</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {data.subscriptions.map((sub, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-900">{sub.plan_name || `Plan #${sub.plan_id}`}</td>
                                <td className="p-3 font-semibold text-slate-700">₹{sub.price}</td>
                                <td className="p-3 text-slate-500">{fmt(sub.start_date)}</td>
                                <td className="p-3 text-slate-500">{fmt(sub.end_date)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    sub.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {sub.is_active ? "Active" : "Expired"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payment Receipts */}
                  {data.payments && data.payments.length > 0 && (
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Payment Receipts & Transactions ({data.payments.length})</h3>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="p-3">Payment ID / Order</th>
                              <th className="p-3">Plan</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {data.payments.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono text-slate-700">
                                  <div className="font-bold">{p.razorpay_payment_id || p.order_id || `#${p.id}`}</div>
                                  {p.order_id && p.razorpay_payment_id && <div className="text-[10px] text-slate-400">{p.order_id}</div>}
                                </td>
                                <td className="p-3 font-medium text-slate-700">{p.plan_name || "Subscription"}</td>
                                <td className="p-3 font-black text-slate-900">₹{p.amount || 0}</td>
                                <td className="p-3 text-slate-500">{fmt(p.created_at)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* APPOINTMENTS TAB */}
              {activeTab === "appointments" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Clinical Consultations</h3>
                  {(!data.appointments || data.appointments.length === 0) ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                      <CalendarCheck size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No consultation bookings</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.appointments.map((apt, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 text-xs md:text-sm">{apt.nutritionist_name || "Nutritionist"}</p>
                            <p className="text-[11px] text-slate-400">{fmt(apt.appointment_date)} · {apt.appointment_type || "Online"}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              apt.status === "cancelled" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                              "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>{apt.status}</span>
                            {apt.fee_amount && <p className="text-[11px] font-bold text-slate-700 mt-1">₹{apt.fee_amount}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="space-y-5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Access Controls & Password Override</h3>

                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    data.is_active
                      ? "bg-slate-50 border-slate-200"
                      : "bg-rose-50/70 border-rose-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        data.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {data.is_active ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">
                            Login Access & Authorization
                          </p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            data.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {data.is_active ? "Active · Login Allowed" : "Blocked · Login Denied"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {data.is_active
                            ? "This user is permitted to authenticate and access their TrackIntake account."
                            : "Login is blocked. All login attempts for this user will fail with HTTP 403 Forbidden."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      disabled={togglingStatus}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs ${
                        data.is_active
                          ? "bg-white border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white"
                          : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {togglingStatus ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : data.is_active ? (
                        <Ban size={13} />
                      ) : (
                        <ShieldCheck size={13} />
                      )}
                      <span>{data.is_active ? "Block Login Access" : "Restore Login Access"}</span>
                    </button>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Key size={16} className="text-purple-500" /> Direct Password Reset
                    </h4>
                    <p className="text-xs text-slate-400">Override account credentials with an admin-assigned password.</p>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password (min 6 characters)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={pwForm.newPassword}
                          onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={pwForm.confirm}
                          onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-500"
                        />
                      </div>

                      {pwMsg && (
                        <p className={`text-xs font-bold ${pwMsg.startsWith("✓") ? "text-emerald-600" : "text-rose-600"}`}>
                          {pwMsg}
                        </p>
                      )}

                      <button
                        onClick={handlePasswordReset}
                        disabled={pwSaving}
                        className="w-full py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-purple-600/20"
                      >
                        {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                        {pwSaving ? "Resetting Credentials..." : "Update User Password"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
