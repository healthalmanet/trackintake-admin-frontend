import { useState, useEffect } from "react";
import { Plus, Pencil, Check, X, Loader2, Crown, Power, PowerOff } from "lucide-react";
import * as api from "../api/plans";

const FEATURE_FIELDS = [
  { key: "appointment_allowed", label: "Appointments" },
  { key: "ai_diet_allowed", label: "AI Diet" },
  { key: "weight_tracker_allowed", label: "Weight Tracker" },
  { key: "nutrition_search_allowed", label: "Nutrition Search" },
  { key: "custom_reminder_allowed", label: "Custom Reminders" },
  { key: "chat_allowed", label: "Chat" },
  { key: "Fat_Calculator_allowed", label: "Fat Calculator" },
  { key: "BMI_Calculator_allowed", label: "BMI Calculator" },
  { key: "meal_log_allowed", label: "Meal Log" },
  { key: "water_intake_allowed", label: "Water Intake Tracker" },
];

const EMPTY_FORM = {
  name: "",
  price: "",
  duration_days: "",
  inhouse_consults: 0,
  expert_consults: 0,
  is_active: true,
  plan_type: "user",
  appointment_allowed: false,
  ai_diet_allowed: false,
  weight_tracker_allowed: false,
  nutrition_search_allowed: false,
  custom_reminder_allowed: false,
  chat_allowed: false,
  Fat_Calculator_allowed: false,
  BMI_Calculator_allowed: false,
  meal_log_allowed: false,
  water_intake_allowed: false,
  expert_consultation_fee: 0,
  inhouse_consultation_fee: 0,
};

const planAccentColors = [
  "border-gray-300 bg-gray-50",
  "border-blue-400 bg-blue-50",
  "border-orange-400 bg-orange-50",
  "border-purple-400 bg-purple-50",
];

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', plan?: {} }
  const [togglingId, setTogglingId] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPlans();
      // Sort plans by ID in descending order (newest first)
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setPlans(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleToggleActive = async (plan) => {
    setTogglingId(plan.id);
    try {
      await api.updatePlan(plan.id, { is_active: !plan.is_active });
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
    } catch (e) {
      alert(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {modal && (
        <PlanModal
          mode={modal.mode}
          plan={modal.plan}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchPlans(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all subscription plans and features</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition cursor-pointer"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-orange-400" />
        </div>
      ) : error ? (
        <div className="text-center py-24 text-red-400 text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              accent={planAccentColors[i % planAccentColors.length]}
              onEdit={() => setModal({ mode: "edit", plan })}
              onToggleActive={() => handleToggleActive(plan)}
              isToggling={togglingId === plan.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, accent, onEdit, onToggleActive, isToggling }) {
  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${plan.is_active ? "border-orange-400" : "border-gray-200 grayscale-[0.3] opacity-80"}`}>
      {/* Header */}
      <div className={`px-5 py-4 ${plan.is_active ? "bg-orange-50" : "bg-gray-50"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {plan.is_active && <Crown size={14} className="text-orange-500" />}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                plan.plan_type === "nutritionist"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {plan.plan_type === "nutritionist" ? "Nutritionist" : "Patient"}
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              Rs {plan.price?.toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1">/ {plan.duration_days} days</span>
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${plan.is_active ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${plan.is_active ? "bg-green-500" : "bg-red-500"}`}></span>
            {plan.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-4 space-y-2">
        {FEATURE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            {plan[key] ? (
              <Check size={14} className="text-green-500 shrink-0" />
            ) : (
              <X size={14} className="text-gray-300 shrink-0" />
            )}
            <span className={`text-sm ${plan[key] ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-2">
          <Check size={14} className={plan.inhouse_consults > 0 ? "text-green-500" : "text-gray-300"} />
          <span className="text-sm text-gray-600">In-house Consults: <span className="font-semibold">{plan.inhouse_consults}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Check size={14} className={plan.expert_consults > 0 ? "text-green-500" : "text-gray-300"} />
          <span className="text-sm text-gray-600">Expert Consults: <span className="font-semibold">{plan.expert_consults}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer">
          <Pencil size={14} /> Edit
        </button>
        <button onClick={onToggleActive} disabled={isToggling}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${plan.is_active ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-green-700 bg-green-100 hover:bg-green-200'} disabled:opacity-50`}>
          {isToggling ? <Loader2 size={14} className="animate-spin" /> : (plan.is_active ? <PowerOff size={14} /> : <Power size={14} />)} 
          {plan.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function PlanModal({ mode, plan, onClose, onSave }) {
  const [form, setForm] = useState(plan ? { ...plan } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert numeric fields to numbers
      const submitData = {
        ...form,
        price: parseInt(form.price) || 0,
        duration_days: parseInt(form.duration_days) || 0,
        inhouse_consults: parseInt(form.inhouse_consults) || 0,
        expert_consults: parseInt(form.expert_consults) || 0,
        inhouse_consultation_fee: parseInt(form.inhouse_consultation_fee) || 0,
        expert_consultation_fee: parseInt(form.expert_consultation_fee) || 0,
      };

      if (mode === "edit") {
        await api.updatePlan(plan.id, submitData);
      } else {
        await api.createPlan(submitData);
      }
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{mode === "edit" ? "Edit Plan" : "Add Plan"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Plan Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Plan Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("plan_type", "user")}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition cursor-pointer ${
                  form.plan_type === "user"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                👤 Patient Plan
              </button>
              <button
                type="button"
                onClick={() => set("plan_type", "nutritionist")}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition cursor-pointer ${
                  form.plan_type === "nutritionist"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                👨‍⚕️ Nutritionist Plan
              </button>
            </div>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (Rs)</label>
              <input required type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
              <input required type="number" min="1" value={form.duration_days} onChange={(e) => set("duration_days", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">In-house Consults</label>
              <input type="number" min="0" value={form.inhouse_consults} onChange={(e) => set("inhouse_consults", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expert Consults</label>
              <input type="number" min="0" value={form.expert_consults} onChange={(e) => set("expert_consults", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">In-house Consultation Fee (Rs)</label>
              <input type="number" min="0" value={form.inhouse_consultation_fee} onChange={(e) => set("inhouse_consultation_fee", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expert Consultation Fee (Rs)</label>
              <input type="number" min="0" value={form.expert_consultation_fee} onChange={(e) => set("expert_consultation_fee", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Features</label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={!!form[key]} onChange={() => toggle(key)}
                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.is_active} onChange={() => toggle("is_active")}
              className="w-4 h-4 accent-orange-500 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">Mark as Active</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer disabled:opacity-60">
              {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
