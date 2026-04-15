import { useState, useMemo } from "react";
import {
  Search, ChevronDown, X, CheckCircle, XCircle,
  Wifi, Users, Calendar, Clock, Filter, ShieldCheck,
  UserPlus, SlidersHorizontal
} from "lucide-react";

// ── Mock DB Data (strictly from DB fields) ─────────────────
const MOCK_PROFILES = [
  { id: 1, user_id: 101, user_name: "Dr. Kavya Reddy", nutritionist_type: "Dietician", is_verified: true, is_virtual_enabled: true },
  { id: 2, user_id: 102, user_name: "Dr. Rahul Desai", nutritionist_type: "Nutritionist", is_verified: true, is_virtual_enabled: false },
  { id: 3, user_id: 103, user_name: "Dr. Sneha Iyer", nutritionist_type: "Clinical Nutritionist", is_verified: false, is_virtual_enabled: true },
  { id: 4, user_id: 104, user_name: "Dr. Arjun Mehta", nutritionist_type: "Dietician", is_verified: true, is_virtual_enabled: true },
  { id: 5, user_id: 105, user_name: "Dr. Pooja Sharma", nutritionist_type: "Nutritionist", is_verified: true, is_virtual_enabled: false },
  { id: 6, user_id: 106, user_name: "Dr. Vikram Nair", nutritionist_type: "Clinical Nutritionist", is_verified: false, is_virtual_enabled: true },
];

const MOCK_SLOTS = [
  { id: 1, nutritionist_id: 1, date: "2026-04-07", start_time: "10:00", end_time: "10:30", is_booked: false },
  { id: 2, nutritionist_id: 1, date: "2026-04-07", start_time: "11:00", end_time: "11:30", is_booked: false },
  { id: 3, nutritionist_id: 2, date: "2026-04-07", start_time: "09:00", end_time: "09:30", is_booked: true },
  { id: 4, nutritionist_id: 2, date: "2026-04-07", start_time: "14:00", end_time: "14:30", is_booked: true },
  { id: 5, nutritionist_id: 4, date: "2026-04-07", start_time: "15:00", end_time: "15:30", is_booked: false },
  { id: 6, nutritionist_id: 4, date: "2026-04-08", start_time: "10:00", end_time: "10:30", is_booked: true },
  { id: 7, nutritionist_id: 5, date: "2026-04-07", start_time: "09:00", end_time: "09:30", is_booked: true },
  { id: 8, nutritionist_id: 5, date: "2026-04-07", start_time: "11:00", end_time: "11:30", is_booked: true },
  { id: 9, nutritionist_id: 5, date: "2026-04-07", start_time: "16:00", end_time: "16:30", is_booked: true },
];

const MOCK_APPOINTMENTS = [
  { id: 1, nutritionist_id: 1, patient_id: 201, slot_id: 1, status: "scheduled" },
  { id: 2, nutritionist_id: 2, patient_id: 202, slot_id: 3, status: "ongoing" },
  { id: 3, nutritionist_id: 4, patient_id: 203, slot_id: 5, status: "scheduled" },
  { id: 4, nutritionist_id: 5, patient_id: 204, slot_id: 7, status: "completed" },
];

const MOCK_ASSIGNMENTS = [
  { nutritionist_id: 1, patient_id: 201 },
  { nutritionist_id: 1, patient_id: 205 },
  { nutritionist_id: 2, patient_id: 202 },
  { nutritionist_id: 4, patient_id: 203 },
  { nutritionist_id: 4, patient_id: 206 },
  { nutritionist_id: 4, patient_id: 207 },
  { nutritionist_id: 5, patient_id: 204 },
];

const MOCK_PATIENTS = [
  { id: 201, name: "Aarav Sharma" }, { id: 202, name: "Priya Mehta" },
  { id: 203, name: "Rohan Verma" }, { id: 204, name: "Sneha Patil" },
  { id: 205, name: "Karan Joshi" }, { id: 206, name: "Ananya Singh" },
  { id: 207, name: "Vikram Nair" },
];

// ── Availability Logic (computed from DB) ──────────────────
const computeAvailability = (nutritionistId) => {
  const slots = MOCK_SLOTS.filter((s) => s.nutritionist_id === nutritionistId);
  if (slots.length === 0) return "Offline";
  const hasActive = MOCK_APPOINTMENTS.some(
    (a) => a.nutritionist_id === nutritionistId && a.status === "ongoing"
  );
  if (hasActive) return "Busy";
  if (slots.every((s) => s.is_booked)) return "Busy";
  return "Available";
};

const AVAIL_STYLE = {
  Available: { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  Busy: { badge: "bg-orange-100 text-orange-600 border-orange-200", dot: "bg-orange-500" },
  Offline: { badge: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

const INITIALS_COLORS = [
  "bg-orange-100 text-orange-600", "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600", "bg-green-100 text-green-600",
  "bg-pink-100 text-pink-600", "bg-indigo-100 text-indigo-600",
];

// ── Sub-components ─────────────────────────────────────────
function AvailabilityBadge({ nutritionistId }) {
  const status = computeAvailability(nutritionistId);
  const s = AVAIL_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.toUpperCase()}
    </span>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
      <CheckCircle size={16} className="text-green-400" />
      {message}
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white cursor-pointer"><X size={14} /></button>
    </div>
  );
}

function NutritionistCard({ profile, onViewDetails, onAssign }) {
  const initials = profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];
  const availability = computeAvailability(profile.id);
  const assignedCount = MOCK_ASSIGNMENTS.filter((a) => a.nutritionist_id === profile.id).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>
            {initials}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{profile.user_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{profile.nutritionist_type}</p>
          </div>
        </div>
        <AvailabilityBadge nutritionistId={profile.id} />
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Verified</span>
          {profile.is_verified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <ShieldCheck size={11} /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
              <XCircle size={11} /> Unverified
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Virtual Enabled</span>
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${profile.is_virtual_enabled ? "text-purple-600 bg-purple-50 border-purple-100" : "text-gray-500 bg-gray-50 border-gray-200"}`}>
            <Wifi size={11} /> {profile.is_virtual_enabled ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs font-medium">Assigned Patients</span>
          <span className="text-xs font-bold text-gray-800">{assignedCount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onViewDetails(profile)}
          className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
        >
          Details
        </button>
        <button
          onClick={() => onAssign(profile)}
          disabled={availability === "Offline"}
          className="flex-1 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Assign
        </button>
      </div>
    </div>
  );
}

function NutritionistDetailsModal({ profile, onClose, onAssign }) {
  const slots = MOCK_SLOTS.filter((s) => s.nutritionist_id === profile.id);
  const appointments = MOCK_APPOINTMENTS.filter((a) => a.nutritionist_id === profile.id);
  const assignedCount = MOCK_ASSIGNMENTS.filter((a) => a.nutritionist_id === profile.id).length;
  const initials = profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  const STATUS_COLOR = {
    scheduled: "bg-blue-50 text-blue-600",
    ongoing: "bg-orange-50 text-orange-600",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${colorClass}`}>
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile.user_name}</p>
              <p className="text-xs text-gray-500">{profile.nutritionist_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"><X size={18} /></button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Basic Info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Basic Info</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  { label: "Nutritionist ID", value: `#${profile.id}` },
                  { label: "User ID", value: `#${profile.user_id}` },
                  { label: "Type", value: profile.nutritionist_type },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Verified</span>
                  {profile.is_verified
                    ? <span className="flex items-center gap-1 text-xs font-semibold text-blue-600"><ShieldCheck size={11} /> Yes</span>
                    : <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><XCircle size={11} /> No</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Virtual Enabled</span>
                  <span className={`text-xs font-semibold ${profile.is_virtual_enabled ? "text-purple-600" : "text-gray-500"}`}>
                    {profile.is_virtual_enabled ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Patients */}
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Assigned Patients</p>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Users size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{assignedCount}</p>
                  <p className="text-xs text-gray-400">Total patients assigned</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { onClose(); onAssign(profile); }}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Assign to Patient
            </button>
          </div>

          {/* Right: Appointments + Slots */}
          <div className="space-y-4">
            {/* Appointments */}
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Appointments</p>
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">No appointments found</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Patient #{a.patient_id}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Slot #{a.slot_id}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_COLOR[a.status] || "bg-gray-100 text-gray-500"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Slots */}
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Availability Slots</p>
              {slots.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">No slots available</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((s) => (
                    <div key={s.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${s.is_booked ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.date}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.start_time} – {s.end_time}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_booked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {s.is_booked ? "Booked" : "Free"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ profile, onClose, onConfirm }) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notify, setNotify] = useState(true);
  const initials = profile.user_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colorClass = INITIALS_COLORS[profile.id % INITIALS_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xl font-bold text-gray-900">Assign Nutritionist</p>
            <p className="text-sm text-gray-400 mt-1">Connect a specialist with a patient profile to begin their restorative journey.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer mt-0.5"><X size={16} /></button>
        </div>

        {/* Selected specialist */}
        <div className="mt-5 mb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Selected Specialist</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>{initials}</div>
            <div>
              <p className="text-sm font-bold text-gray-900">{profile.user_name}</p>
              <p className="text-xs text-orange-500 font-medium">{profile.nutritionist_type}</p>
            </div>
          </div>
        </div>

        {/* Patient select */}
        <div className="mt-4 mb-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Patient</p>
          <div className="relative">
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full appearance-none pl-4 pr-8 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700">
              <option value="">Select a patient...</option>
              {MOCK_PATIENTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Notify checkbox */}
        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <div
            onClick={() => setNotify(!notify)}
            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition ${notify ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}
          >
            {notify && <CheckCircle size={12} className="text-white" />}
          </div>
          <span className="text-sm text-gray-600">Notify Patient via Email and Dashboard</span>
        </label>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-5">
          <button
            disabled={!selectedPatient}
            onClick={() => onConfirm(profile, selectedPatient, notify)}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
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

export default function Nutritionists() {
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [detailsModal, setDetailsModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleConfirmAssign = (profile, patientId, notify) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === parseInt(patientId));
    setAssignModal(null);
    showToast(`${patient?.name} assigned to ${profile.user_name}${notify ? " · Notification sent" : ""}`);
  };

  const types = ["All Types", ...new Set(MOCK_PROFILES.map((n) => n.nutritionist_type))];

  const filtered = useMemo(() => {
    return MOCK_PROFILES.filter((n) => {
      const avail = computeAvailability(n.id);
      const matchSearch = !search || n.user_name.toLowerCase().includes(search.toLowerCase()) || String(n.user_id).includes(search);
      const matchAvail = availFilter === "All Status" || avail === availFilter;
      const matchType = typeFilter === "All Types" || n.nutritionist_type === typeFilter;
      const matchVerified = verifiedFilter === "All" || (verifiedFilter === "Verified" ? n.is_verified : !n.is_verified);
      return matchSearch && matchAvail && matchType && matchVerified;
    });
  }, [search, availFilter, typeFilter, verifiedFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search || availFilter !== "All Status" || typeFilter !== "All Types" || verifiedFilter !== "All";

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {detailsModal && <NutritionistDetailsModal profile={detailsModal} onClose={() => setDetailsModal(null)} onAssign={setAssignModal} />}
      {assignModal && <AssignModal profile={assignModal} onClose={() => setAssignModal(null)} onConfirm={handleConfirmAssign} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutritionists</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and assign professional practitioners.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or user ID..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <SlidersHorizontal size={15} /> FILTERS
        </div>
        {[
          { options: ["All Status", "Available", "Busy", "Offline"], value: availFilter, set: setAvailFilter },
          { options: types, value: typeFilter, set: setTypeFilter },
          { options: ["All", "Verified", "Unverified"], value: verifiedFilter, set: setVerifiedFilter },
        ].map(({ options, value, set }, i) => (
          <div key={i} className="relative">
            <select value={value} onChange={(e) => { set(e.target.value); setPage(1); }}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer text-gray-700 font-medium">
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}
        {hasFilters && (
          <button onClick={() => { setSearch(""); setAvailFilter("All Status"); setTypeFilter("All Types"); setVerifiedFilter("All"); setPage(1); }}
            className="ml-auto text-sm font-semibold text-orange-500 hover:text-orange-600 transition cursor-pointer">
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: MOCK_PROFILES.length, color: "text-gray-900", border: "border-gray-300" },
          { label: "Available", value: MOCK_PROFILES.filter(n => computeAvailability(n.id) === "Available").length, color: "text-green-600", border: "border-green-400" },
          { label: "Verified", value: MOCK_PROFILES.filter(n => n.is_verified).length, color: "text-blue-600", border: "border-blue-400" },
          { label: "Virtual", value: MOCK_PROFILES.filter(n => n.is_virtual_enabled).length, color: "text-purple-600", border: "border-purple-400" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-white rounded-xl border-t-2 ${border} border-x border-b border-gray-100 shadow-sm px-4 py-3`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <Filter size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No nutritionists matched your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((n) => (
            <NutritionistCard key={n.id} profile={n} onViewDetails={setDetailsModal} onAssign={setAssignModal} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
          <span className="text-xs text-gray-500 font-medium">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition cursor-pointer ${p === page ? "bg-orange-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
