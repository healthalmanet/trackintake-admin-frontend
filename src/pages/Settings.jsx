import { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon, IndianRupee, ShieldCheck, CheckCircle2,
  AlertCircle, RefreshCw, Loader2, Save, Building2, Video, Search,
  Users, Sparkles, Check, ArrowRight, ExternalLink, HelpCircle
} from "lucide-react";
import * as api from "../api/settings";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  // Form State
  const [onlinePrice, setOnlinePrice] = useState(499);
  const [offlinePrice, setOfflinePrice] = useState(499);
  const [autoApply, setAutoApply] = useState(true);
  const [applyImmediately, setApplyImmediately] = useState(true);

  // Response State
  const [config, setConfig] = useState(null);
  const [metrics, setMetrics] = useState({
    total_inhouse: 0,
    total_experts: 0,
    matching_online: 0,
    matching_offline: 0,
    fully_compliant: 0,
    non_compliant: 0,
    compliance_percentage: 100,
  });
  const [practitioners, setPractitioners] = useState([]);

  // Fetch Settings Data
  const loadData = useCallback(async (searchTerm = search) => {
    try {
      setError("");
      const res = await api.getInhousePricingSettings(searchTerm);
      if (res.status === "success") {
        setConfig(res.config);
        setOnlinePrice(res.config.online_price);
        setOfflinePrice(res.config.offline_price);
        setAutoApply(res.config.auto_apply_to_all);
        setMetrics(res.metrics || {});
        setPractitioners(res.practitioners || []);
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (onlinePrice < 0 || offlinePrice < 0) {
      setError("Consultation rates cannot be negative.");
      return;
    }

    const confirmMsg = `Are you sure you want to set global In-House rates to:\n• Online: ₹${onlinePrice}\n• In-Clinic: ₹${offlinePrice}\n\nThis will synchronize ${metrics.total_inhouse || 22} in-house clinicians.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.updateInhousePricingSettings({
        online_price: parseFloat(onlinePrice),
        offline_price: parseFloat(offlinePrice),
        auto_apply_to_all: autoApply,
        apply_to_existing: applyImmediately,
      });

      if (res.status === "success") {
        setSuccessMsg(res.message || "Global in-house consultation prices updated successfully!");
        await loadData();
      }
    } catch (err) {
      setError(err.message || "Failed to update pricing settings.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = config && (
    Number(onlinePrice) !== Number(config.online_price) ||
    Number(offlinePrice) !== Number(config.offline_price) ||
    Boolean(autoApply) !== Boolean(config.auto_apply_to_all)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black shadow-xs">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Global System Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enforce standardized in-house clinician consultation rates, compliance rules, and platform defaults
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-3 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Key Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed Online Rate</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{config?.online_price ?? 499}
          </div>
          <span className="text-xs text-slate-500 font-medium block">
            Telehealth session benchmark
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed In-Clinic Rate</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{config?.offline_price ?? 499}
          </div>
          <span className="text-xs text-slate-500 font-medium block">
            Physical consultation standard
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-House Staff Count</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {metrics.total_inhouse} Clinicians
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 size={13} />
            <span>{metrics.compliance_percentage}% Rate Aligned</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Independent Specialists</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.total_experts} Specialists
          </div>
          <span className="text-xs text-slate-400 font-medium block">
            Exempt · Custom rate autonomy
          </span>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-slate-50/40 to-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                Core Pricing Policy
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Globally Fixed In-House Consultant Rates
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                TrackIntake platform policy requires all internal In-House nutritionists to adhere to uniform pricing. Independent Expert Specialists manage separate, individualized rates.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Online Price Input Box */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Video size={18} className="text-blue-600" />
                  Standard Online Consultation Rate
                </span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Telehealth
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Fixed session fee charged to patients for virtual video / audio consultations booked with any In-House practitioner.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Rate in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={onlinePrice}
                    onChange={(e) => setOnlinePrice(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-lg sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    placeholder="499"
                  />
                </div>
              </div>
            </div>

            {/* Offline Price Input Box */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4 hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Building2 size={18} className="text-purple-600" />
                  Standard In-Clinic Consultation Rate
                </span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  In-Person
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Fixed session fee charged to patients for in-clinic physical appointments booked with any In-House practitioner at hospital locations.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Rate in INR (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={offlinePrice}
                    onChange={(e) => setOfflinePrice(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-lg sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500"
                    placeholder="499"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Automation & Policy Checkboxes */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="w-4 h-4 mt-1 text-orange-500 rounded focus:ring-orange-400 cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Enforce on All Future In-House Practitioner Onboardings
                </span>
                <span className="text-xs text-slate-500">
                  Automatically set online and in-clinic consultation prices to these fixed values when new in-house nutritionists register or are approved.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-slate-200/60">
              <input
                type="checkbox"
                checked={applyImmediately}
                onChange={(e) => setApplyImmediately(e.target.checked)}
                className="w-4 h-4 mt-1 text-orange-500 rounded focus:ring-orange-400 cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Bulk Synchronize Existing {metrics.total_inhouse || 22} In-House Clinicians
                </span>
                <span className="text-xs text-slate-500">
                  Immediately update all existing active in-house nutritionist database profiles so no practitioner deviates from this pricing standard.
                </span>
              </div>
            </label>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              Last saved: <strong className="text-slate-800">{config?.updated_at ? new Date(config.updated_at).toLocaleString() : "Never"}</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (config) {
                    setOnlinePrice(config.online_price);
                    setOfflinePrice(config.offline_price);
                    setAutoApply(config.auto_apply_to_all);
                  }
                }}
                disabled={!hasChanges || saving}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-40"
              >
                Reset Changes
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save & Enforce Global Rates
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* In-House Practitioners Compliance Directory */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              In-House Clinicians Rate Directory ({practitioners.length} Listed)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live audit view of all in-house nutritionists and their active session rates
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clinician by name or clinic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 w-64"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Practitioner Identity</th>
                <th className="py-3.5 px-4">Affiliated Clinic</th>
                <th className="py-3.5 px-4 text-center">Online Fee</th>
                <th className="py-3.5 px-4 text-center">In-Clinic Fee</th>
                <th className="py-3.5 px-4 text-center">Rate Status</th>
                <th className="py-3.5 px-6 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {practitioners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No in-house clinicians match the search criteria.
                  </td>
                </tr>
              ) : (
                practitioners.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center shrink-0">
                            {(p.full_name || "N").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.full_name}</span>
                            <span className="text-xs text-slate-400 font-medium block truncate max-w-xs">{p.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700 capitalize">
                          {p.current_organization || "TrackIntake Clinical Staff"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        ₹{p.online_price}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        ₹{p.offline_price}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.is_compliant
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {p.is_compliant ? "✓ Standard Rate" : "Rate Deviation"}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          p.is_verified
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {p.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

