import { useState, useEffect, useMemo } from "react";
import {
  Plus, Pencil, Check, X, Loader2, Crown, Power, PowerOff,
  Search, ChevronDown, Sparkles, User, Stethoscope, CheckCircle2,
  IndianRupee, Layers, ShieldCheck, RefreshCw
} from "lucide-react";
import * as api from "../api/plans";

const PATIENT_FEATURE_FIELDS = [
  { key: "appointment_allowed", label: "Appointments" },
  { key: "ai_diet_allowed", label: "AI Diet Formulation" },
  { key: "weight_tracker_allowed", label: "Weight Tracker" },
  { key: "nutrition_search_allowed", label: "Nutrition Search" },
  { key: "custom_reminder_allowed", label: "Custom Reminders" },
  { key: "chat_allowed", label: "Chat Support" },
  { key: "Fat_Calculator_allowed", label: "Body Fat Calculator" },
  { key: "BMI_Calculator_allowed", label: "BMI Calculator" },
  { key: "meal_log_allowed", label: "Meal Log" },
  { key: "water_intake_allowed", label: "Water Intake Tracker" },
];

const NUTRITIONIST_FEATURE_FIELDS = [
  { key: "nutri_ai_diet_allowed", label: "AI Diet Engine" },
  { key: "nutri_manual_diet_allowed", label: "Manual Diet Planner" },
  { key: "nutri_bulk_upload_allowed", label: "Bulk Patient Upload" },
  { key: "nutri_lab_reports_allowed", label: "Lab Reports Analysis" },
  { key: "nutri_smart_assistant_allowed", label: "Nutro AI Assistant" },
  { key: "nutri_online_appointment_allowed", label: "Online Consultations" },
  { key: "nutri_offline_appointment_allowed", label: "Clinic Consultations" },
  { key: "nutri_chat_allowed", label: "Direct Patient Chat" },
  { key: "nutri_export_reports_allowed", label: "Export Clinical Reports" },
];

const EMPTY_FORM = {
  name: "",
  price: "",
  duration_days: "",
  inhouse_consults: 0,
  expert_consults: 0,
  is_active: true,
  plan_type: "patient",
  // Patient features
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
  // Nutritionist features
  nutri_ai_diet_allowed: false,
  nutri_manual_diet_allowed: false,
  nutri_bulk_upload_allowed: false,
  nutri_lab_reports_allowed: false,
  nutri_smart_assistant_allowed: false,
  nutri_online_appointment_allowed: false,
  nutri_offline_appointment_allowed: false,
  nutri_chat_allowed: false,
  nutri_export_reports_allowed: false,
  nutri_max_patients: 0,
};

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState("patient");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPlans();
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
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !plan.is_active } : p));
    } catch (e) {
      alert(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesTab = activeTab === "patient"
        ? (plan.plan_type === "patient" || plan.plan_type === "user" || !plan.plan_type)
        : (plan.plan_type === "nutritionist");

      const matchesSearch = !search || plan.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all"
        ? true
        : statusFilter === "active" ? plan.is_active : !plan.is_active;

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [plans, activeTab, search, statusFilter]);

  const patientPlansCount = plans.filter(p => p.plan_type === "patient" || p.plan_type === "user" || !p.plan_type).length;
  const nutritionistPlansCount = plans.filter(p => p.plan_type === "nutritionist").length;
  const activePlansCount = plans.filter(p => p.is_active).length;
  const minPrice = plans.length > 0 ? Math.min(...plans.map(p => Number(p.price) || 0)) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {modal && (
        <PlanModal
          mode={modal.mode}
          plan={modal.plan}
          initialPlanType={activeTab}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchPlans(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Membership Tiers & Privileges
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {plans.length} Total Plans Configured
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Subscription Plans & Entitlements
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Configure client tiers, practitioner memberships, session quotas & tool permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPlans()}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-xs"
            title="Refresh Plans"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-sm shadow-orange-500/20 transition cursor-pointer shrink-0"
          >
            <Plus size={16} /> Create Plan
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Active Tiers",
            value: activePlansCount,
            sub: "Currently live on mobile",
            icon: ShieldCheck,
            color: "text-emerald-600",
            border: "border-emerald-200",
            bg: "bg-emerald-50 text-emerald-700",
            active: statusFilter === "active",
            onClick: () => setStatusFilter(statusFilter === "active" ? "all" : "active"),
          },
          {
            label: "Patient Plans",
            value: patientPlansCount,
            sub: "Diet & consultation tiers",
            icon: User,
            color: "text-orange-600",
            border: "border-orange-200",
            bg: "bg-orange-50 text-orange-700",
            active: activeTab === "patient",
            onClick: () => setActiveTab("patient"),
          },
          {
            label: "Nutritionist Plans",
            value: nutritionistPlansCount,
            sub: "Clinical SaaS packages",
            icon: Stethoscope,
            color: "text-blue-600",
            border: "border-blue-200",
            bg: "bg-blue-50 text-blue-700",
            active: activeTab === "nutritionist",
            onClick: () => setActiveTab("nutritionist"),
          },
          {
            label: "Starting Tier Price",
            value: `₹${minPrice.toLocaleString()}`,
            sub: "Lowest accessible plan",
            icon: IndianRupee,
            color: "text-purple-600",
            border: "border-purple-200",
            bg: "bg-purple-50 text-purple-700",
            active: false,
            onClick: () => { setStatusFilter("all"); setSearch(""); },
          },
        ].map(({ label, value, sub, icon: Icon, color, border, bg, active, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
              active
                ? `${border} ring-2 ring-orange-500/20 bg-white shadow-md`
                : "bg-white border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>
              {loading ? "—" : value}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === "patient"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User size={15} />
              Patient Membership Plans
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-600">
                {patientPlansCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("nutritionist")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === "nutritionist"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Stethoscope size={15} />
              Nutritionist Clinical Plans
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-600">
                {nutritionistPlansCount}
              </span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {plans.filter(p => p.is_active).length} Active Tiers
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              {plans.filter(p => !p.is_active).length} Archived
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plan tier by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 focus:bg-white transition font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Statuses" },
              { id: "active", label: "Active Only" },
              { id: "inactive", label: "Archived" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setStatusFilter(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === p.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-200/80">
          <Loader2 size={36} className="animate-spin text-orange-500 mb-2" />
          <span className="text-xs font-bold text-slate-500">Loading plan tiers...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-600 font-bold text-xs">
          {error}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
          <Crown size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No subscription tiers found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search parameters or create a new plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
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

function PlanCard({ plan, onEdit, onToggleActive, isToggling }) {
  const isNutri = plan.plan_type === "nutritionist";
  const featureList = isNutri ? NUTRITIONIST_FEATURE_FIELDS : PATIENT_FEATURE_FIELDS;

  return (
    <div className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${
      plan.is_active
        ? (isNutri ? "border-blue-200/80 hover:border-blue-300" : "border-orange-200/80 hover:border-orange-300")
        : "border-slate-200 opacity-75"
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        plan.is_active
          ? (isNutri ? "bg-gradient-to-br from-blue-50/60 to-transparent border-blue-100" : "bg-gradient-to-br from-orange-50/60 to-transparent border-orange-100")
          : "bg-slate-50 border-slate-100"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isNutri ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
              }`}>
                {isNutri ? "🧑‍⚕️ Nutritionist Tier" : "👤 Patient Tier"}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                plan.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                {plan.is_active ? "Active" : "Archived"}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-2.5 tracking-tight">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{(plan.price || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {plan.duration_days} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="p-6 flex-1 space-y-2.5 text-xs">
        <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-3">
          {isNutri ? "Clinical & Tool Access" : "Member Privileges"}
        </p>

        {featureList.map(({ key, label }) => {
          const enabled = Boolean(plan[key]);
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                enabled ? (isNutri ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600") : "bg-slate-100 text-slate-300"
              }`}>
                {enabled ? <Check size={11} strokeWidth={3} /> : <X size={9} strokeWidth={2.5} />}
              </div>
              <span className={`font-medium ${enabled ? "text-slate-800 font-bold" : "text-slate-400 line-through"}`}>
                {label}
              </span>
            </div>
          );
        })}

        {/* Capacity / Consultations Limits */}
        <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
          {isNutri ? (
            <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
              <span className="text-slate-600 font-bold text-xs">Assigned Patient Limit:</span>
              <span className="font-black text-blue-700 text-xs">
                {plan.nutri_max_patients ? `${plan.nutri_max_patients} Patients` : "Unlimited Patients"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">In-House</span>
                <span className="text-sm font-black text-orange-600">
                  {plan.inhouse_consults ? `${plan.inhouse_consults} sessions` : "Unlimited"}
                </span>
              </div>
              <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Specialist Expert</span>
                <span className="text-sm font-black text-purple-600">
                  {plan.expert_consults ? `${plan.expert_consults} sessions` : "Unlimited"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-2xs"
        >
          <Pencil size={12} /> Edit Tier
        </button>
        <button
          onClick={onToggleActive}
          disabled={isToggling}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 ${
            plan.is_active
              ? "text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200"
              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          {isToggling ? <Loader2 size={13} className="animate-spin" /> : (plan.is_active ? <PowerOff size={13} /> : <Power size={13} />)}
          {plan.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function PlanModal({ mode, plan, initialPlanType, onClose, onSave }) {
  const [form, setForm] = useState(plan ? { ...plan } : { ...EMPTY_FORM, plan_type: initialPlanType || "patient" });
  const [saving, setSaving] = useState(false);

  const isNutri = form.plan_type === "nutritionist";

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));
  const setVal = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseInt(form.price) || 0,
        duration_days: parseInt(form.duration_days) || 0,
        inhouse_consults: parseInt(form.inhouse_consults) || 0,
        expert_consults: parseInt(form.expert_consults) || 0,
        nutri_max_patients: parseInt(form.nutri_max_patients) || 0,
      };

      if (mode === "add") {
        await api.createPlan(payload);
      } else {
        await api.updatePlan(plan.id, payload);
      }
      onSave();
    } catch (err) {
      alert("Error saving plan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 to-white">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {mode === "add" ? "Create New Subscription Tier" : `Edit Plan: ${plan.name}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define duration, pricing, and enabled clinical privileges</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Target Audience */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Target Audience</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVal("plan_type", "patient")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  form.plan_type === "patient"
                    ? "bg-orange-50 border-orange-500 text-orange-600 shadow-xs"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <User size={15} /> Patient Plan
              </button>
              <button
                type="button"
                onClick={() => setVal("plan_type", "nutritionist")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  form.plan_type === "nutritionist"
                    ? "bg-blue-50 border-blue-500 text-blue-600 shadow-xs"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Stethoscope size={15} /> Nutritionist Plan
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setVal("name", e.target.value)}
                placeholder="Hero, Silver, Pro"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => setVal("price", e.target.value)}
                placeholder="999"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.duration_days}
                onChange={(e) => setVal("duration_days", e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 font-semibold"
              />
            </div>
          </div>

          {/* Conditional Consultation / Capacity Limits */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">
              {isNutri ? "Practitioner Patient Capacity" : "Included Consultations (0 = Unlimited)"}
            </h4>
            {isNutri ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Maximum Assigned Patients</label>
                <input
                  type="number"
                  min="0"
                  value={form.nutri_max_patients || 0}
                  onChange={(e) => setVal("nutri_max_patients", e.target.value)}
                  className="w-full sm:w-48 px-3.5 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/20 font-bold"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">In-House Consultations</label>
                  <input
                    type="number"
                    min="0"
                    value={form.inhouse_consults || 0}
                    onChange={(e) => setVal("inhouse_consults", e.target.value)}
                    className="w-full px-3.5 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Specialist Consultations</label>
                  <input
                    type="number"
                    min="0"
                    value={form.expert_consults || 0}
                    onChange={(e) => setVal("expert_consults", e.target.value)}
                    className="w-full px-3.5 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Feature Toggles */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
              {isNutri ? "Nutritionist Permissions & Clinical Tools" : "Patient Features Enabled"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(isNutri ? NUTRITIONIST_FEATURE_FIELDS : PATIENT_FEATURE_FIELDS).map(({ key, label }) => (
                <label
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                    form[key]
                      ? (isNutri ? "bg-blue-50/50 border-blue-300 text-blue-900" : "bg-orange-50/50 border-orange-300 text-orange-900")
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold">{label}</span>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                    form[key] ? (isNutri ? "bg-blue-600 text-white" : "bg-orange-500 text-white") : "bg-slate-100 text-transparent"
                  }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Plan Active Status</span>
              <span className="text-[11px] text-slate-400">Archived tiers won't be offered on patient checkout</span>
            </div>
            <button
              type="button"
              onClick={() => toggle("is_active")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                form.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {form.is_active ? "Active" : "Archived"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? "Saving..." : (mode === "add" ? "Create Tier" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
