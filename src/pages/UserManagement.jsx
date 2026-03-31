import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Eye, Pencil, ChevronDown, Loader2, X, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";
import * as api from "../api/users";

const PLANS = ["All", "Basic", "Hero", "Silver", "Free"];
const STATUSES = ["All", "Active", "Inactive"];

const planColors = {
  Basic: "bg-blue-50 text-blue-600",
  Hero: "bg-orange-50 text-orange-600",
  Silver: "bg-purple-50 text-purple-600",
  Free: "bg-green-50 text-green-600",
  None: "bg-gray-100 text-gray-500",
};

export default function UserManagement({ pageState = {} }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(pageState.dateFilter || "");
  const [dateFilterMode, setDateFilterMode] = useState(pageState.dateFilterMode || "date");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(pageState.statusFilter || "All");
  
  // Modals
  const [modal, setModal] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Local state for checking toggles
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Backend only takes 'search' param right now for full_name/email, 
      // other filters will be applied locally on the fetched dataset.
      const data = await api.getUsers(); 
      const userList = Array.isArray(data) ? data : (data.results || []);
      setUsers(userList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    setTogglingId(user.id);
    try {
      const payload = { is_active: !user.is_active };
      await api.updateUser(user.id, payload);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleView = async (user) => {
    setViewUser(user);
    setHealthProfile(null);
    setProfileLoading(true);
    try {
      const profile = await api.getUserHealthProfile(user.id);
      setHealthProfile(profile);
    } catch {
      setHealthProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // 1. Search Query (Name & Email)
      const lowerSearch = search.toLowerCase();
      const matchSearch = !search || 
        (u.full_name || "").toLowerCase().includes(lowerSearch) || 
        (u.email || "").toLowerCase().includes(lowerSearch);
        
      // 2. City Filter (assuming city might be in health profile, but if it's on the user object we map it)
      // Since 'city' isn't explicitly returned from getUsers always, we match loosely
      const matchCity = !cityFilter || (u.city || "").toLowerCase().includes(cityFilter.toLowerCase());

      // 3. Date Filter (exact date match)
      const matchDate = !dateFilter || (u.date_joined && u.date_joined.startsWith(dateFilter));

      // 4. Plan & Status
      const matchPlan = planFilter === "All" || (u.plan || "Free") === planFilter;
      const matchStatus = statusFilter === "All" ||
        (statusFilter === "Active" ? u.is_active : !u.is_active);
        
      return matchSearch && matchCity && matchDate && matchPlan && matchStatus;
    });
  }, [users, search, cityFilter, dateFilter, planFilter, statusFilter]);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {modal && (
        <UserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUsers(); }}
        />
      )}
      {viewUser && (
        <ViewModal
          user={viewUser}
          profile={healthProfile}
          loading={profileLoading}
          onClose={() => { setViewUser(null); setHealthProfile(null); }}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage users, view health profiles, and control access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Registered", value: users.length, color: "text-gray-900" },
          { label: "Active Access", value: users.filter((u) => u.is_active).length, color: "text-green-600" },
          { label: "Revoked Access", value: users.filter((u) => !u.is_active).length, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border-t-2 border-orange-400 border-x border-b border-gray-100 shadow-sm px-5 py-4 transition hover:-translate-y-0.5 duration-300">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-1`}>{loading ? "—" : value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-800">Filter Users</h3>
        <div className="flex flex-wrap gap-3 items-center">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
          </div>

          <div className="relative flex-1 min-w-[150px]">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
          </div>

          <div className="flex bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-400 transition min-w-[220px] shadow-sm">
            <select
              value={dateFilterMode}
              onChange={(e) => { setDateFilterMode(e.target.value); setDateFilter(""); }}
              className="bg-gray-50 border-r border-gray-200 text-xs font-semibold px-2 py-2 text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-100 transition rounded-l-lg appearance-none"
            >
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <div className="relative flex-1">
              <input
                type={dateFilterMode === "year" ? "number" : dateFilterMode}
                min={dateFilterMode === "year" ? "2020" : undefined}
                max={dateFilterMode === "year" ? "2100" : undefined}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder={dateFilterMode === "year" ? "Year (e.g. 2026)" : undefined}
                className="w-full pl-3 pr-8 py-2 text-sm bg-transparent focus:outline-none text-gray-700"
              />
              <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {[
            { label: "Plan", options: PLANS, value: planFilter, set: setPlanFilter },
            { label: "Status", options: STATUSES, value: statusFilter, set: setStatusFilter },
          ].map(({ label, options, value, set }) => (
            <div key={label} className="relative min-w-[120px]">
              <select value={value} onChange={(e) => set(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition cursor-pointer text-gray-700">
                {options.map((o) => <option key={o} value={o}>{o === "All" ? `${label}: All` : o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Name", "Email", "City", "Plan", "Status", "Registered", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={24} className="animate-spin text-orange-400 mx-auto" /></td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-12 text-red-500 font-medium text-sm">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No users matched the filters.</td></tr>
              ) : (
                filtered.map((user, i) => (
                  <tr key={user.id} className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                        </div>
                        <span className="font-semibold text-gray-800">{user.full_name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-medium">{user.email || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{user.city || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${planColors[user.plan] || planColors.None}`}>
                        {user.plan || "Free"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${user.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600 border border-red-100"}`}>
                        {user.is_active ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-medium tracking-wide">
                      {user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button title="View Details" onClick={() => handleView(user)} className="p-2 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition cursor-pointer">
                          <Eye size={16} />
                        </button>
                        <button title="Edit User" onClick={() => setModal({ user })} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                          <Pencil size={16} />
                        </button>
                        
                        {/* TOGGLE STATUS BUTTON replacing DELETE */}
                        <button 
                          title={user.is_active ? "Deactivate User" : "Activate User"} 
                          onClick={() => handleToggleActive(user)} 
                          disabled={togglingId === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${user.is_active ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-green-700 bg-green-50 hover:bg-green-100"} disabled:opacity-50`}
                        >
                          {togglingId === user.id ? <Loader2 size={13} className="animate-spin" /> : null}
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Showing {filtered.length} of {users.length} users</span>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user ? {
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    plan: user?.plan ?? "Free",
    is_active: user?.is_active ?? true,
    city: user?.city ?? "",
  } : {
    full_name: "",
    email: "",
    plan: "Free",
    is_active: true,
    city: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUser(user.id, form);
      onSave();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { label: "Full Name", key: "full_name", type: "text", required: true },
            { label: "Email", key: "email", type: "email", required: true },
            { label: "City", key: "city", type: "text", required: false },
          ].map(({ label, key, type, required }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
              <input type={type} required={required} value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Plan</label>
              <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition">
                {["Free", "Basic", "Hero", "Silver"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
              <select value={form.is_active ? "Active" : "Inactive"}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "Active" }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition">
                {["Active", "Inactive"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition cursor-pointer disabled:opacity-60 shadow-sm shadow-orange-500/20">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewModal({ user, profile, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-sm font-medium text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer shadow-sm">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Plan", user.plan],
              ["Status", user.is_active ? "Active" : "Inactive"],
              ["Joined", user.date_joined ? new Date(user.date_joined).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
              ["City", user.city || profile?.city || "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Health profile */}
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3 border-b-2 border-orange-100 pb-2 inline-block">Health Profile</h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-orange-400" /></div>
            ) : !profile ? (
              <div className="bg-orange-50/50 rounded-xl p-6 text-center border font-medium border-orange-100">
                <p className="text-sm text-gray-500">No health profile found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    ["Date of Birth", profile.date_of_birth],
                    ["Gender", profile.gender],
                    ["Country", profile.country],
                    ["Mobile", profile.mobile_number],
                    ["Occupation", profile.occupation],
                    ["Height", profile.height_cm ? `${profile.height_cm} cm` : null],
                    ["Weight", profile.weight_kg ? `${profile.weight_kg} kg` : null],
                    ["Activity Level", profile.activity_level],
                    ["Goal", profile.goal],
                    ["Diet Type", profile.diet_type],
                    ["Allergies", profile.allergies],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-lg px-3 py-2 hover:shadow-sm transition">
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5 truncate">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-bold text-gray-800 mb-2">Health Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Diabetic", profile.is_diabetic],
                    ["Hypertensive", profile.is_hypertensive],
                    ["Heart Condition", profile.has_heart_condition],
                    ["Thyroid Disorder", profile.has_thyroid_disorder],
                    ["Arthritis", profile.has_arthritis],
                    ["Gastric Issues", profile.has_gastric_issues],
                    ["Pregnant", profile.is_pregnant],
                    ["Breastfeeding", profile.is_breastfeeding],
                  ].map(([label, val]) => (
                    <span key={label} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${val ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                      {val ? "✓" : "✗"} {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
