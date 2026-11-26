import { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon, Video, Building2, Percent, Users, Sparkles,
  Search, RefreshCw, Loader2, Save, CheckCircle2, AlertCircle, Edit3,
  X, Check, ArrowRight, ShieldCheck, ChevronRight
} from "lucide-react";
import * as api from "../api/settings";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("inhouse"); // 'inhouse' | 'expert'
  const [search, setSearch] = useState("");

  // Global Config Form State
  const [onlinePrice, setOnlinePrice] = useState(499);
  const [offlinePrice, setOfflinePrice] = useState(499);
  const [inhouseCommission, setInhouseCommission] = useState(5);
  const [expertCommission, setExpertCommission] = useState(5);
  const [autoApply, setAutoApply] = useState(true);
  const [applyImmediately, setApplyImmediately] = useState(true);

  // Expert Consultation Pricing Mode State
  const [expertFixedPricing, setExpertFixedPricing] = useState(false);
  const [expertOnlinePrice, setExpertOnlinePrice] = useState(999);
  const [expertOfflinePrice, setExpertOfflinePrice] = useState(999);
  const [applyExpertImmediately, setApplyExpertImmediately] = useState(true);

  // Response Data
  const [config, setConfig] = useState(null);
  const [metrics, setMetrics] = useState({
    total_inhouse: 0,
    total_experts: 0,
    compliance_percentage: 100,
  });
  const [inhousePractitioners, setInhousePractitioners] = useState([]);
  const [expertPractitioners, setExpertPractitioners] = useState([]);

  // Edit Practitioner Modal State
  const [editingPractitioner, setEditingPractitioner] = useState(null);
  const [editOnlinePrice, setEditOnlinePrice] = useState("");
  const [editOfflinePrice, setEditOfflinePrice] = useState("");
  const [isCustomCommission, setIsCustomCommission] = useState(false);
  const [editCustomCommission, setEditCustomCommission] = useState("");
  const [savingPractitioner, setSavingPractitioner] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch Settings Data
  const loadData = useCallback(async (searchTerm = search) => {
    try {
      setError("");
      const res = await api.getInhousePricingSettings(searchTerm);
      if (res.status === "success") {
        setConfig(res.config);
        setOnlinePrice(res.config.online_price);
        setOfflinePrice(res.config.offline_price);
        setInhouseCommission(res.config.platform_commission_percent ?? 5);
        setExpertCommission(res.config.expert_commission_percent ?? 5);
        setAutoApply(res.config.auto_apply_to_all);
        setExpertFixedPricing(Boolean(res.config.expert_fixed_pricing_enabled));
        setExpertOnlinePrice(res.config.expert_online_price ?? 999);
        setExpertOfflinePrice(res.config.expert_offline_price ?? 999);
        setMetrics(res.metrics || {});
        setInhousePractitioners(res.inhouse_practitioners || []);
        setExpertPractitioners(res.expert_practitioners || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(search);
  };

  // Save In-House Settings
  const handleSaveInhouse = async (e) => {
    e.preventDefault();
    if (onlinePrice < 0 || offlinePrice < 0) {
      setError("Consultation rates cannot be negative.");
      return;
    }
    if (inhouseCommission < 0 || inhouseCommission > 100) {
      setError("In-house commission cut must be between 0% and 100%.");
      return;
    }

    setSavingGlobal(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.updateInhousePricingSettings({
        online_price: parseFloat(onlinePrice),
        offline_price: parseFloat(offlinePrice),
        platform_commission_percent: parseFloat(inhouseCommission),
        expert_commission_percent: parseFloat(expertCommission),
        auto_apply_to_all: autoApply,
        apply_to_existing: applyImmediately,
        expert_fixed_pricing_enabled: expertFixedPricing,
        expert_online_price: parseFloat(expertOnlinePrice || 0),
        expert_offline_price: parseFloat(expertOfflinePrice || 0),
        apply_expert_to_existing: false,
      });

      if (res.status === "success") {
        setSuccessMsg(res.message || "In-house pricing and commission updated successfully!");
        await loadData();
      }
    } catch (err) {
      setError(err.message || "Failed to update pricing settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Save Expert Settings
  const handleSaveExpert = async (e) => {
    e.preventDefault();
    if (expertCommission < 0 || expertCommission > 100) {
      setError("Expert commission cut must be between 0% and 100%.");
      return;
    }
    if (expertFixedPricing && (Number(expertOnlinePrice) < 0 || Number(expertOfflinePrice) < 0)) {
      setError("Expert fixed consultation rates cannot be negative.");
      return;
    }

    setSavingGlobal(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.updateInhousePricingSettings({
        online_price: parseFloat(onlinePrice),
        offline_price: parseFloat(offlinePrice),
        platform_commission_percent: parseFloat(inhouseCommission),
        expert_commission_percent: parseFloat(expertCommission),
        auto_apply_to_all: autoApply,
        apply_to_existing: false, // Don't overwrite in-house rates
        expert_fixed_pricing_enabled: expertFixedPricing,
        expert_online_price: parseFloat(expertOnlinePrice || 0),
        expert_offline_price: parseFloat(expertOfflinePrice || 0),
        apply_expert_to_existing: expertFixedPricing && applyExpertImmediately,
      });

      if (res.status === "success") {
        setSuccessMsg(res.message || "Expert specialist consultation & commission policy updated successfully!");
        await loadData();
      }
    } catch (err) {
      setError(err.message || "Failed to update expert settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Open Edit Practitioner Modal
  const openEditModal = (practitioner) => {
    setEditingPractitioner(practitioner);
    setEditOnlinePrice(practitioner.online_price);
    setEditOfflinePrice(practitioner.offline_price);
    if (practitioner.custom_commission_percent !== null && practitioner.custom_commission_percent !== undefined) {
      setIsCustomCommission(true);
      setEditCustomCommission(practitioner.custom_commission_percent);
    } else {
      setIsCustomCommission(false);
      const defaultRate = practitioner.nutritionist_type === "expert" ? expertCommission : inhouseCommission;
      setEditCustomCommission(defaultRate);
    }
    setModalError("");
  };

  // Save Individual Practitioner Changes
  const handleSavePractitioner = async (e) => {
    e.preventDefault();
    if (!editingPractitioner) return;

    if (Number(editOnlinePrice) < 0 || Number(editOfflinePrice) < 0) {
      setModalError("Pricing rates cannot be negative.");
      return;
    }

    if (isCustomCommission && (Number(editCustomCommission) < 0 || Number(editCustomCommission) > 100)) {
      setModalError("Custom commission percentage must be between 0% and 100%.");
      return;
    }

    setSavingPractitioner(true);
    setModalError("");

    try {
      await api.updatePractitionerPricing(editingPractitioner.id, {
        online_price: parseFloat(editOnlinePrice),
        offline_price: parseFloat(editOfflinePrice),
        use_default_commission: !isCustomCommission,
        custom_commission_percent: isCustomCommission ? parseFloat(editCustomCommission) : null,
      });

      setSuccessMsg(`Successfully updated pricing and commission for ${editingPractitioner.full_name}!`);
      setEditingPractitioner(null);
      await loadData();
    } catch (err) {
      setModalError(err.message || "Failed to update practitioner.");
    } finally {
      setSavingPractitioner(false);
    }
  };

  const currentPractitioners = activeTab === "inhouse" ? inhousePractitioners : expertPractitioners;

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shrink-0">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Consultation Rates & Platform Commission
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure standardized in-house pricing, expert commission cuts, and practitioner overrides
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-center"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("inhouse")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            activeTab === "inhouse"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 size={16} />
          In-House Nutritionists
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === "inhouse" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {metrics.total_inhouse || inhousePractitioners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expert")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            activeTab === "expert"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles size={16} />
          Expert Specialists
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === "expert" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {metrics.total_experts || expertPractitioners.length}
          </span>
        </button>
      </div>

      {/* TAB 1: IN-HOUSE NUTRITIONISTS */}
      {activeTab === "inhouse" && (
        <div className="space-y-5">
          {/* Compact In-House Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Global In-House Policy
                </span>
                <h2 className="text-base font-black text-slate-900 mt-1">
                  Fixed Consultation Rates & Commission Fee Cut
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Standardizes pricing across all {metrics.total_inhouse || inhousePractitioners.length} in-house clinicians
              </span>
            </div>

            <form onSubmit={handleSaveInhouse} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Online Rate */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Video size={14} className="text-blue-600" />
                    Fixed Online Rate (₹)
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={onlinePrice}
                      onChange={(e) => setOnlinePrice(e.target.value)}
                      required
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block">Standard virtual video session</span>
                </div>

                {/* In-Clinic Rate */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 size={14} className="text-purple-600" />
                    Fixed In-Clinic Rate (₹)
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={offlinePrice}
                      onChange={(e) => setOfflinePrice(e.target.value)}
                      required
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block">Physical clinic appointment</span>
                </div>

                {/* Platform Commission Cut */}
                <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Percent size={14} className="text-orange-600" />
                      In-House Commission Cut (%)
                    </span>
                    <span className="text-[11px] font-black text-orange-600">{inhouseCommission}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={inhouseCommission}
                      onChange={(e) => setInhouseCommission(e.target.value)}
                      required
                      className="w-full pr-7 pl-3 py-1.5 bg-white border border-orange-300 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    {[0, 5, 10, 15, 20].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setInhouseCommission(rate)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          Number(inhouseCommission) === rate
                            ? "bg-orange-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:text-orange-600"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compact Simulation + Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">On ₹1,000 session:</span>
                    <span className="font-bold text-orange-600">TrackIntake ₹{((1000 * Number(inhouseCommission || 0)) / 100).toFixed(0)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-emerald-600">Payout ₹{(1000 - (1000 * Number(inhouseCommission || 0)) / 100).toFixed(0)}</span>
                  </div>

                  <label className="hidden md:flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyImmediately}
                      onChange={(e) => setApplyImmediately(e.target.checked)}
                      className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-orange-400 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-500">Sync all existing clinicians</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingGlobal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 self-end sm:self-auto"
                >
                  {savingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save In-House Policy
                </button>
              </div>
            </form>
          </div>

          {/* In-House Clinicians Directory */}
          <PractitionerTable
            title="In-House Clinicians Directory"
            subtitle="View session rates and platform fee cuts. Click 'Edit' on any clinician to customize individual pricing or commission."
            practitioners={inhousePractitioners}
            search={search}
            setSearch={setSearch}
            handleSearchSubmit={handleSearchSubmit}
            onEdit={openEditModal}
            defaultCommission={inhouseCommission}
          />
        </div>
      )}

      {/* TAB 2: EXPERT NUTRITIONISTS */}
      {activeTab === "expert" && (
        <div className="space-y-5">
          {/* Compact Expert Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Global Expert Specialists Policy
                </span>
                <h2 className="text-base font-black text-slate-900 mt-1">
                  Expert Consultation Pricing Mode & Commission Fee Cut
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                expertFixedPricing
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {expertFixedPricing ? "🔒 Fixed Pricing Enforced" : "🔄 Variable (Nutritionist-Controlled)"}
              </span>
            </div>

            <form onSubmit={handleSaveExpert} className="p-4 sm:p-5 space-y-4">
              {/* Toggle: Enforce Fixed Pricing vs Variable Pricing */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none ${
                expertFixedPricing
                  ? "bg-orange-50/60 border-orange-300"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
              }`}>
                <input
                  type="checkbox"
                  checked={expertFixedPricing}
                  onChange={(e) => setExpertFixedPricing(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900 block">
                    Enforce Fixed Consultation Rates for Expert Nutritionists
                  </span>
                  <span className="text-xs text-slate-600 block">
                    {expertFixedPricing
                      ? "Checked (Fixed): TrackIntake controls and enforces fixed Online and In-Clinic consultation rates across expert specialists."
                      : "Unchecked (Variable): Consultation rates depend on each individual expert nutritionist (they set their own rates). Check this box to switch to fixed rates."}
                  </span>
                </div>
              </label>

              {/* Fixed Expert Rates (Only shown when Checked) */}
              {expertFixedPricing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                  {/* Expert Online Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Video size={14} className="text-blue-600" />
                      Fixed Expert Online Rate (₹)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={expertOnlinePrice}
                        onChange={(e) => setExpertOnlinePrice(e.target.value)}
                        required={expertFixedPricing}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block">Enforced virtual video consultation fee</span>
                  </div>

                  {/* Expert In-Clinic Rate */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 size={14} className="text-purple-600" />
                      Fixed Expert In-Clinic Rate (₹)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={expertOfflinePrice}
                        onChange={(e) => setExpertOfflinePrice(e.target.value)}
                        required={expertFixedPricing}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block">Enforced physical clinic consultation fee</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expert Platform Commission Setting */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Percent size={14} className="text-amber-600" />
                      Expert Platform Commission Cut (%)
                    </span>
                    <span className="text-xs font-black text-amber-600">{expertCommission}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={expertCommission}
                      onChange={(e) => setExpertCommission(e.target.value)}
                      required
                      className="w-full pr-7 pl-3 py-1.5 bg-white border border-amber-300 rounded-lg text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    {[0, 5, 10, 15, 20].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setExpertCommission(rate)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                          Number(expertCommission) === rate
                            ? "bg-amber-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:text-amber-600"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info & Simulation */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {expertFixedPricing ? "Fixed Rate Policy with Platform Commission" : "Variable Pricing with Platform Commission"}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      {expertFixedPricing
                        ? <>Fixed rates (Online <strong>₹{expertOnlinePrice}</strong>, In-Clinic <strong>₹{expertOfflinePrice}</strong>) are enforced. TrackIntake deducts <strong>{expertCommission}%</strong> commission per booking.</>
                        : <>Expert specialists set their own variable appointment rates. TrackIntake deducts <strong>{expertCommission}%</strong> from bookings. You can still customize individual rates below.</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-400">On ₹{expertFixedPricing ? (expertOnlinePrice || 1000) : 1000} session:</span>
                    <span className="font-bold text-amber-700">TrackIntake ₹{(((expertFixedPricing ? Number(expertOnlinePrice || 1000) : 1000) * Number(expertCommission || 0)) / 100).toFixed(0)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-emerald-700">Expert ₹{((expertFixedPricing ? Number(expertOnlinePrice || 1000) : 1000) - ((expertFixedPricing ? Number(expertOnlinePrice || 1000) : 1000) * Number(expertCommission || 0)) / 100).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div>
                  {expertFixedPricing && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyExpertImmediately}
                        onChange={(e) => setApplyExpertImmediately(e.target.checked)}
                        className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-orange-400 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-600">Sync fixed rates to all existing expert specialists</span>
                    </label>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingGlobal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 self-end sm:self-auto"
                >
                  {savingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Expert Policy
                </button>
              </div>
            </form>
          </div>

          {/* Expert Specialists Directory */}
          <PractitionerTable
            title="Expert Specialists Directory"
            subtitle={expertFixedPricing
              ? "Fixed pricing is currently enforced. Click 'Edit' on any specialist to customize individual pricing or commission."
              : "Variable mode active: specialists set their own rates. Click 'Edit' on any specialist to customize their pricing or commission."}
            practitioners={expertPractitioners}
            search={search}
            setSearch={setSearch}
            handleSearchSubmit={handleSearchSubmit}
            onEdit={openEditModal}
            defaultCommission={expertCommission}
          />
        </div>
      )}

      {/* EDIT PRACTITIONER MODAL */}
      {editingPractitioner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  {(editingPractitioner.full_name || "N").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    {editingPractitioner.full_name}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      editingPractitioner.nutritionist_type === "expert"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {editingPractitioner.nutritionist_type === "expert" ? "Expert Specialist" : "In-House"}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500">{editingPractitioner.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPractitioner(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePractitioner} className="p-4 sm:p-5 space-y-4">
              {/* Pricing Rates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Video size={13} className="text-blue-600" /> Online Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editOnlinePrice}
                      onChange={(e) => setEditOnlinePrice(e.target.value)}
                      required
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Building2 size={13} className="text-purple-600" /> In-Clinic Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editOfflinePrice}
                      onChange={(e) => setEditOfflinePrice(e.target.value)}
                      required
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commission Fee Cut */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Percent size={14} className="text-orange-600" /> Platform Commission
                  </span>
                  <span className="text-xs font-black text-orange-600">
                    {isCustomCommission ? `${editCustomCommission}% (Custom)` : `${editingPractitioner.nutritionist_type === "expert" ? expertCommission : inhouseCommission}% (Default)`}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="commission_type"
                      checked={!isCustomCommission}
                      onChange={() => setIsCustomCommission(false)}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>
                      Use standard {editingPractitioner.nutritionist_type === "expert" ? "Expert" : "In-House"} policy (<strong>{editingPractitioner.nutritionist_type === "expert" ? expertCommission : inhouseCommission}%</strong>)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="commission_type"
                      checked={isCustomCommission}
                      onChange={() => setIsCustomCommission(true)}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Set custom commission rate for this practitioner</span>
                  </label>

                  {isCustomCommission && (
                    <div className="pt-1 pl-5">
                      <div className="relative max-w-[140px]">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editCustomCommission}
                          onChange={(e) => setEditCustomCommission(e.target.value)}
                          placeholder="5.0"
                          className="w-full pr-7 pl-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPractitioner(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPractitioner}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingPractitioner ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Practitioner Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Compact Practitioner Table
function PractitionerTable({ title, subtitle, practitioners, search, setSearch, handleSearchSubmit, onEdit, defaultCommission }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black text-slate-900">{title} ({practitioners.length})</h3>
          <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or clinic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 w-52"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-2.5 px-4">Practitioner</th>
              <th className="py-2.5 px-3">Affiliation / Org</th>
              <th className="py-2.5 px-3 text-center">Online Fee</th>
              <th className="py-2.5 px-3 text-center">In-Clinic Fee</th>
              <th className="py-2.5 px-3 text-center">Commission Cut</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {practitioners.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  No practitioners found matching search criteria.
                </td>
              </tr>
            ) : (
              practitioners.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-black text-[11px] flex items-center justify-center shrink-0">
                          {(p.full_name || "N").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[160px]">{p.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[160px]">{p.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-slate-600 font-medium truncate block max-w-[140px]">
                        {p.current_organization || "Independent Practice"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      ₹{p.online_price}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      ₹{p.offline_price}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.has_custom_commission
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-orange-50 text-orange-700 border border-orange-200"
                      }`}>
                        {p.effective_commission_percent}% {p.has_custom_commission ? "(Custom)" : ""}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.is_verified ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {p.is_verified ? "Verified" : "Pending"}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
