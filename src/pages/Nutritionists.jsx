import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, CheckCircle, Users,
  Filter, SlidersHorizontal, Loader2, Check, Video,
  Building2, Award, FileText, IndianRupee, ShieldCheck
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

function NutritionistCard({ profile, onViewDetails, onAssign, onToggleVerify }) {
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];
  const isExpert = (profile.nutritionist_type || "").toLowerCase().includes("expert");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between gap-4">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                Dr. {profile.user_name || `Nutritionist #${profile.user_id}`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isExpert ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {isExpert ? "⭐ Specialist Expert" : "🏢 In-House"}
                </span>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                    <ShieldCheck size={11} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 shrink-0">#{profile.id}</span>
        </div>

        {/* Practice & Rates Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Online Consult</span>
            <span className="text-xs font-bold text-gray-800">
              {profile.online_price ? `₹${profile.online_price}` : "Free / Standard"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">In-Clinic Rate</span>
            <span className="text-xs font-bold text-gray-800">
              {profile.offline_price ? `₹${profile.offline_price}` : "Free / Standard"}
            </span>
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-2 mt-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Email</span>
            <span className="text-gray-700 truncate max-w-[170px] font-medium">{profile.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Assigned Patients</span>
            <span className="font-bold text-orange-500">{profile.patient_count || 0} active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Virtual Consultations</span>
            <span className={`font-semibold ${profile.is_virtual_enabled ? "text-green-600" : "text-gray-400"}`}>
              {profile.is_virtual_enabled ? "✓ Enabled" : "✗ Disabled"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(profile)}
          className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
        >
          Details
        </button>

        <button
          onClick={() => onToggleVerify(profile)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
            profile.is_verified
              ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
              : "text-white bg-green-600 hover:bg-green-700 shadow-sm"
          }`}
        >
          {profile.is_verified ? "Unverify" : "Verify"}
        </button>

        <button
          onClick={() => onAssign(profile)}
          className="flex-1 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition cursor-pointer shadow-sm shadow-orange-500/20"
        >
          Assign
        </button>
      </div>
    </div>
  );
}

function DetailsModal({ profile, onClose, onAssign, onToggleVerify }) {
  const initials = profile.user_name
    ? profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : `N${profile.id}`;
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${colorClass}`}>
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900">Dr. {profile.user_name || `Nutritionist #${profile.user_id}`}</p>
              <p className="text-xs text-gray-500">{profile.nutritionist_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Practice Rates Overview */}
          <div>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-2">Practice & Consultation Rates</p>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div>
                <span className="text-gray-400 block font-medium">Online Video Rate</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {profile.online_price ? `₹${profile.online_price}` : "Free / Standard"}
                </span>
                {profile.pending_online_price && (
                  <span className="text-[10px] text-amber-600 block mt-0.5">
                    Pending request: ₹{profile.pending_online_price}
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block font-medium">In-Clinic Rate</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {profile.offline_price ? `₹${profile.offline_price}` : "Free / Standard"}
                </span>
                {profile.pending_offline_price && (
                  <span className="text-[10px] text-amber-600 block mt-0.5">
                    Pending request: ₹{profile.pending_offline_price}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Credentials */}
          <div>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-2">Professional Info</p>
            <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Experience</span>
                <span className="font-semibold text-gray-800">{profile.years_of_experience ? `${profile.years_of_experience} Years` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Qualification</span>
                <span className="font-semibold text-gray-800">{profile.qualification || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Registration Number</span>
                <span className="font-semibold text-gray-800">{profile.registration_number || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Clinic Location</span>
                <span className="font-semibold text-gray-800">{profile.offline_location || "—"}</span>
              </div>
            </div>
          </div>

          {/* Verification Documents Status */}
          <div>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-2">Verification Documents</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Degree Certificate", val: profile.qualification_certificate },
                { label: "Registration Cert", val: profile.registration_certificate },
                { label: "Government ID", val: profile.government_id },
                { label: "Experience Certificate", val: profile.experience_certificate },
              ].map((doc) => (
                <div key={doc.label} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium truncate">{doc.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    doc.val ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                  }`}>
                    {doc.val ? "Uploaded" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Patients Summary */}
          <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Users size={16} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{profile.patient_count || 0}</p>
                <p className="text-[10px] text-gray-400">Total assigned patients</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onAssign(profile); }}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-xs transition"
            >
              Assign Patients
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ profile, onClose, onConfirm }) {
  const [selected, setSelected] = useState("");
  const [notify, setNotify] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const filterPatients = async () => {
      try {
        setLoading(true);
        const data = await getEligibleUsersForNutritionist(profile.nutritionist_type);
        setFilteredPatients(data.users || []);
      } catch (err) {
        setFilteredPatients([]);
      } finally {
        setLoading(false);
      }
    };
    filterPatients();
  }, [profile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Assign Patient</h3>
            <p className="text-xs text-gray-400">Assigning to Dr. {profile.user_name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">Select Eligible Patient</label>
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              <Loader2 size={18} className="animate-spin mx-auto text-orange-500 mb-1" />
              Checking eligible subscribers...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500 border border-gray-200">
              No eligible patients available for this practitioner tier.
            </div>
          ) : (
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">Select a patient...</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.email || `Plan: ${p.plan_name}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-xs text-gray-600">Notify patient via in-app notification</span>
          </label>
        </div>

        <div className="flex gap-2 pt-5 border-t border-gray-100 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            disabled={!selected || loading}
            onClick={() => onConfirm(profile, selected, notify)}
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Nutritionists({ pageState }) {
  const [nutritionists, setNutritionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(() => pageState?.type || "All");
  const [verifiedFilter, setVerifiedFilter] = useState(() => pageState?.verified || "All");
  const [virtualFilter, setVirtualFilter] = useState("All");

  useEffect(() => {
    if (pageState?.type) setTypeFilter(pageState.type);
    if (pageState?.verified) setVerifiedFilter(pageState.verified);
  }, [pageState]);

  const [detailsModal, setDetailsModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchNutritionists = useCallback(() => {
    setLoading(true);
    getNutritionists()
      .then((data) => setNutritionists(data.data || []))
      .catch(() => setNutritionists([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNutritionists();
  }, [fetchNutritionists]);

  const handleConfirmAssign = async (profile, patientId, notify) => {
    try {
      await assignNutritionist(patientId, profile.user_id);
      setAssignModal(null);
      showToast(`${profile.user_name || "Nutritionist"} assigned successfully!`);
      fetchNutritionists();
    } catch (err) {
      showToast("Assignment failed: " + err.message);
    }
  };

  const handleToggleVerify = async (profile) => {
    try {
      await approveNutritionist(profile.user_id);
      showToast(`Verification status updated for Dr. ${profile.user_name || "Nutritionist"}`);
      fetchNutritionists();
    } catch (err) {
      showToast("Verification failed: " + err.message);
    }
  };

  const filtered = useMemo(() => {
    return nutritionists.filter((n) => {
      const nameMatch = !search ||
        (n.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (n.email || "").toLowerCase().includes(search.toLowerCase()) ||
        String(n.user_id).includes(search);

      const typeMatch = typeFilter === "All" ||
        (typeFilter === "expert" && (n.nutritionist_type || "").toLowerCase().includes("expert")) ||
        (typeFilter === "inhouse" && !(n.nutritionist_type || "").toLowerCase().includes("expert"));

      const verifiedMatch = verifiedFilter === "All" ||
        (verifiedFilter === "verified" && n.is_verified) ||
        (verifiedFilter === "unverified" && !n.is_verified);

      const virtualMatch = virtualFilter === "All" ||
        (virtualFilter === "yes" && n.is_virtual_enabled) ||
        (virtualFilter === "no" && !n.is_virtual_enabled);

      return nameMatch && typeMatch && verifiedMatch && virtualMatch;
    });
  }, [nutritionists, search, typeFilter, verifiedFilter, virtualFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {detailsModal && (
        <DetailsModal
          profile={detailsModal}
          onClose={() => setDetailsModal(null)}
          onAssign={setAssignModal}
          onToggleVerify={handleToggleVerify}
        />
      )}
      {assignModal && (
        <AssignModal
          profile={assignModal}
          onClose={() => setAssignModal(null)}
          onConfirm={handleConfirmAssign}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nutritionists Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage professional practitioner accounts, tiers, consultation rates, and patient allocations.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Practitioners</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{nutritionists.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Verified</span>
          <p className="text-2xl font-bold text-green-600 mt-1">{nutritionists.filter((n) => n.is_verified).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Specialist Experts</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{nutritionists.filter((n) => (n.nutritionist_type || "").toLowerCase().includes("expert")).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Assigned Patients</span>
          <p className="text-2xl font-bold text-orange-500 mt-1">{nutritionists.reduce((s, n) => s + (n.patient_count || 0), 0)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-2.5 text-xs font-semibold text-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 uppercase text-[11px] pr-2">
          <SlidersHorizontal size={14} /> Filters
        </div>

        {/* Tier filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Tiers</option>
          <option value="inhouse">In-House Practitioners</option>
          <option value="expert">Specialist Experts</option>
        </select>

        {/* Verification filter */}
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Verification</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Unverified Only</option>
        </select>

        {/* Virtual Consultation filter */}
        <select
          value={virtualFilter}
          onChange={(e) => setVirtualFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Modes</option>
          <option value="yes">Virtual Enabled</option>
          <option value="no">In-Clinic Only</option>
        </select>

        {(search || typeFilter !== "All" || verifiedFilter !== "All" || virtualFilter !== "All") && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("All");
              setVerifiedFilter("All");
              setVirtualFilter("All");
            }}
            className="ml-auto text-xs font-semibold text-orange-500 hover:text-orange-600 cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400 text-sm">
          No nutritionists match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <NutritionistCard
              key={n.id}
              profile={n}
              onViewDetails={setDetailsModal}
              onAssign={setAssignModal}
              onToggleVerify={handleToggleVerify}
            />
          ))}
        </div>
      )}
    </div>
  );
}
