import { useState, useMemo, useEffect } from "react";
import {
  Search, ChevronDown, X, CheckCircle, Users,
  Filter, SlidersHorizontal, Loader2, Check
} from "lucide-react";
import { getNutritionists, assignNutritionist, getEligibleUsersForNutritionist, approveNutritionist } from "../api/users";

const INITIALS_COLORS = [
  "bg-orange-100 text-orange-600", "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600", "bg-green-100 text-green-600",
  "bg-pink-100 text-pink-600", "bg-indigo-100 text-indigo-600",
];

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
      <CheckCircle size={16} className="text-green-400" />{message}
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white cursor-pointer"><X size={14} /></button>
    </div>
  );
}

function NutritionistCard({ profile, onViewDetails, onAssign, onApprove }) {
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>{initials}</div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{profile.user_name || `Nutritionist #${profile.user_id}`}</p>
          <p className="text-xs text-gray-500 mt-0.5">{profile.nutritionist_type}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Email</span>
          <span className="text-xs text-gray-700 truncate max-w-[160px]">{profile.email || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Verified</span>
          <span className={`text-xs font-bold ${profile.is_verified ? "text-green-600" : "text-gray-400"}`}>
            {profile.is_verified ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Virtual Enabled</span>
          <span className={`text-xs font-bold ${profile.is_virtual_enabled ? "text-purple-600" : "text-gray-400"}`}>
            {profile.is_virtual_enabled ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Assigned Patients</span>
          <span className="text-xs font-bold text-orange-500">{profile.patient_count || 0}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onViewDetails(profile)}
          className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer">
          Details
        </button>
        {!profile.is_verified && (
          <button onClick={() => onApprove(profile)}
            className="flex-1 py-2 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition cursor-pointer flex items-center justify-center gap-1">
            <Check size={14} /> Verify
          </button>
        )}
        <button onClick={() => onAssign(profile)}
          className="flex-1 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition cursor-pointer">
          Assign
        </button>
      </div>
    </div>
  );
}

function DetailsModal({ profile, onClose, onAssign }) {
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${colorClass}`}>{initials}</div>
            <div>
              <p className="font-bold text-gray-900">{profile.user_name || `Nutritionist #${profile.user_id}`}</p>
              <p className="text-xs text-gray-500">{profile.nutritionist_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {[
                ["Nutritionist ID", `#${profile.id}`],
                ["User ID", `#${profile.user_id}`],
                ["Name", profile.user_name || "—"],
                ["Email", profile.email || "—"],
                ["Type", profile.nutritionist_type],
                ["Verified", profile.is_verified ? "✓ Yes" : "✗ No"],
                ["Virtual Enabled", profile.is_virtual_enabled ? "Yes" : "No"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">{l}</span>
                  <span className="text-xs font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Users size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profile.patient_count || 0}</p>
              <p className="text-xs text-gray-400">Total patients assigned</p>
            </div>
          </div>

          <button onClick={() => { onClose(); onAssign(profile); }}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer">
            Assign to Patient
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ profile, patients, onClose, onConfirm }) {
  const [selected, setSelected] = useState("");
  const [notify, setNotify] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  // Filter patients based on nutritionist type
  useEffect(() => {
    const filterPatients = async () => {
      try {
        setLoading(true);
        const data = await getEligibleUsersForNutritionist(profile.nutritionist_type);
        setFilteredPatients(data.users || []);
      } catch (error) {
        console.error('Error fetching eligible users:', error);
        setFilteredPatients([]);
      } finally {
        setLoading(false);
      }
    };
    
    filterPatients();
  }, [profile.nutritionist_type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xl font-bold text-gray-900">Assign Nutritionist</p>
            <p className="text-sm text-gray-400 mt-1">Connect a specialist with a patient to begin their journey.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer mt-0.5"><X size={16} /></button>
        </div>

        <div className="mt-5 mb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Selected Specialist</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>{initials}</div>
            <div>
              <p className="text-sm font-bold text-gray-900">{profile.user_name || `Nutritionist #${profile.user_id}`}</p>
              <p className="text-xs text-orange-500 font-medium">{profile.nutritionist_type}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 mb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Patient</p>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-orange-400" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="w-full py-3 px-4 text-sm text-gray-500 bg-gray-50 rounded-xl text-center">
              No eligible patients available
            </div>
          ) : (
            <div className="relative">
              <select value={selected} onChange={(e) => setSelected(e.target.value)}
                className="w-full appearance-none pl-4 pr-8 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700">
                <option value="">Select a patient...</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} (Plan: {p.plan_name})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <div onClick={() => setNotify(!notify)}
            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition ${notify ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}>
            {notify && <CheckCircle size={12} className="text-white" />}
          </div>
          <span className="text-sm text-gray-600">Notify Patient via Email and Dashboard</span>
        </label>

        <div className="flex flex-col gap-2 mt-5">
          <button disabled={!selected || loading} onClick={() => onConfirm(profile, selected, notify)}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50">
            Confirm Assignment
          </button>
          <button onClick={onClose}
            className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-xl transition cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalModal({ profile, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  const handleVerify = async () => {
    setLoading(true);
    try {
      await onConfirm(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xl font-bold text-gray-900">Verify Nutritionist</p>
            <p className="text-sm text-gray-400 mt-1">Confirm verification for this professional.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
        </div>

        <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-4 mb-4 border border-green-100">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>{initials}</div>
          <div>
            <p className="text-sm font-bold text-gray-900">{profile.user_name || `Nutritionist #${profile.user_id}`}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Type</span>
            <span className="text-xs font-bold text-gray-800">{profile.nutritionist_type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Verified</span>
            <span className={`text-xs font-bold ${profile.is_verified ? "text-green-600" : "text-yellow-500"}`}>
              {profile.is_verified ? "✓ Yes" : "⏳ Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Virtual Enabled</span>
            <span className={`text-xs font-bold ${profile.is_virtual_enabled ? "text-purple-600" : "text-gray-400"}`}>
              {profile.is_virtual_enabled ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">Once verified, this nutritionist will be able to accept patient assignments and provide services.</p>

        <div className="flex flex-col gap-2">
          <button disabled={loading} onClick={handleVerify}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {loading ? "Verifying..." : "Verify Nutritionist"}
          </button>
          <button onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Nutritionists() {
  const [nutritionists, setNutritionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [detailsModal, setDetailsModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    getNutritionists()
      .then((data) => setNutritionists(data.data || []))
      .catch(() => setNutritionists([]))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmAssign = async (profile, patientId, notify) => {
    try {
      await assignNutritionist(patientId, profile.user_id);
      setAssignModal(null);
      showToast(`${profile.user_name || "Nutritionist"} assigned successfully${notify ? " · Notification sent" : ""}`);
      
      // Refresh nutritionists list to show updated patient count
      getNutritionists()
        .then((data) => setNutritionists(data.data || []))
        .catch(() => console.error("Failed to refresh nutritionists"));
    } catch (err) {
      showToast("Assignment failed: " + err.message);
    }
  };

  const handleApproveNutritionist = async (profile) => {
    try {
      await approveNutritionist(profile.user_id);
      setApprovalModal(null);
      showToast(`${profile.user_name || "Nutritionist"} verified successfully`);
      
      // Refresh nutritionists list
      getNutritionists()
        .then((data) => setNutritionists(data.data || []))
        .catch(() => console.error("Failed to refresh nutritionists"));
    } catch (err) {
      showToast("Verification failed: " + err.message);
    }
  };

  const types = ["All Types", ...new Set(nutritionists.map((n) => n.nutritionist_type).filter(Boolean))];

  const filtered = useMemo(() => nutritionists.filter((n) => {
    const matchSearch = !search || (n.user_name || "").toLowerCase().includes(search.toLowerCase()) || String(n.user_id).includes(search);
    const matchType = typeFilter === "All Types" || n.nutritionist_type === typeFilter;
    return matchSearch && matchType;
  }), [nutritionists, search, typeFilter]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-orange-400" />
    </div>
  );

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {detailsModal && <DetailsModal profile={detailsModal} onClose={() => setDetailsModal(null)} onAssign={setAssignModal} />}
      {assignModal && <AssignModal profile={assignModal} onClose={() => setAssignModal(null)} onConfirm={handleConfirmAssign} />}
      {approvalModal && <ApprovalModal profile={approvalModal} onClose={() => setApprovalModal(null)} onConfirm={handleApproveNutritionist} />}

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutritionists</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and assign professional practitioners.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or user ID..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total", value: nutritionists.length, color: "text-gray-900", border: "border-gray-300" },
          { label: "Total Patients", value: nutritionists.reduce((s, n) => s + (n.patient_count || 0), 0), color: "text-orange-500", border: "border-orange-400" },
          { label: "Types", value: new Set(nutritionists.map(n => n.nutritionist_type)).size, color: "text-blue-600", border: "border-blue-400" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-white rounded-xl border-t-2 ${border} border-x border-b border-gray-100 shadow-sm px-4 py-3`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500"><SlidersHorizontal size={15} /> FILTERS</div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700 font-medium">
            {types.map((o) => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {(search || typeFilter !== "All Types") && (
          <button onClick={() => { setSearch(""); setTypeFilter("All Types"); }}
            className="ml-auto text-sm font-semibold text-orange-500 hover:text-orange-600 cursor-pointer">Clear All</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <Filter size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No nutritionists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <NutritionistCard key={n.id} profile={n} onViewDetails={setDetailsModal} onAssign={setAssignModal} onApprove={setApprovalModal} />
          ))}
        </div>
      )}
    </div>
  );
}
