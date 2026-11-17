import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, Stethoscope, Search, Filter, RefreshCw,
  Loader2, CheckCircle2, AlertCircle, UserPlus, ChevronLeft,
  ChevronRight, ArrowRight, X, Calendar, Building2, Phone,
  Mail, ShieldCheck, Check, Sparkles, UserMinus, RotateCcw
} from "lucide-react";
import * as api from "../api/assignments";

export default function PatientAssignment({ pageState = {} }) {
  const [activeTab, setActiveTab] = useState("assigned"); // "assigned", "nutritionists", "unassigned"
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedNutriFilter, setSelectedNutriFilter] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssigned, setTotalAssigned] = useState(0);

  // Caseloads Tab Filters
  const [caseloadSearch, setCaseloadSearch] = useState("");
  const [caseloadTypeFilter, setCaseloadTypeFilter] = useState("all");
  const [caseloadLevelFilter, setCaseloadLevelFilter] = useState("all");
  const [caseloadSort, setCaseloadSort] = useState("desc");

  // Data
  const [metrics, setMetrics] = useState({
    total_patients: 0,
    assigned_patients: 0,
    unassigned_patients: 0,
    total_nutritionists: 0,
    avg_caseload: 0,
  });
  const [nutritionists, setNutritionists] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unassignedList, setUnassignedList] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Batch Assignment Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchNutriId, setBatchNutriId] = useState("");
  const [batchPatientIds, setBatchPatientIds] = useState(new Set());
  const [batchNutriSearch, setBatchNutriSearch] = useState("");
  const [batchNutriTypeFilter, setBatchNutriTypeFilter] = useState("all");
  const [batchNutriCaseloadFilter, setBatchNutriCaseloadFilter] = useState("all");

  const [batchPatientSearch, setBatchPatientSearch] = useState("");
  const [batchPatientFilter, setBatchPatientFilter] = useState("all"); // "all", "unassigned", "assigned"
  const [batchPatientNutriFilter, setBatchPatientNutriFilter] = useState("all"); // "all" or specific nutritionist_id
  const [batchPatientPlanFilter, setBatchPatientPlanFilter] = useState("all");
  const [batchPatientGoalFilter, setBatchPatientGoalFilter] = useState("all");

  // Reassign Modal
  const [reassignTarget, setReassignTarget] = useState(null); // { assignment_id, patient, current_nutri }
  const [newNutriId, setNewNutriId] = useState("");
  const [reassignSearch, setReassignSearch] = useState("");
  const [reassignTypeFilter, setReassignTypeFilter] = useState("all");

  // Unassign Modal
  const [unassignTarget, setUnassignTarget] = useState(null); // { assignment_id, patient, nutritionist }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAssignments({
        search,
        nutritionist_id: selectedNutriFilter,
        plan: selectedPlanFilter,
        tab: activeTab,
        page,
        page_size: pageSize,
      });

      if (res.status === "success") {
        setMetrics(res.metrics || {});
        setNutritionists(res.nutritionists || []);
        setAssignments(res.assignments || []);
        setUnassignedList(res.unassigned || []);
        setCandidates(res.all_patients || []);
        setTotalAssigned(res.total_assigned || 0);
        setTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      showToast(err.message || "Failed to load assignment data.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, selectedNutriFilter, selectedPlanFilter, activeTab, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  // Open Batch Modal with optional preset nutritionist
  const openBatchAssign = (presetNutriId = "") => {
    setBatchNutriId(presetNutriId ? String(presetNutriId) : (nutritionists[0]?.id ? String(nutritionists[0].id) : ""));
    setBatchPatientIds(new Set());
    setBatchNutriSearch("");
    setBatchNutriTypeFilter("all");
    setBatchNutriCaseloadFilter("all");
    setBatchPatientSearch("");
    setBatchPatientFilter("all");
    setBatchPatientNutriFilter("all");
    setBatchPatientPlanFilter("all");
    setBatchPatientGoalFilter("all");
    setShowBatchModal(true);
  };

  // Available unique plans and goals from all candidates
  const availablePlans = Array.from(new Set(candidates.map((c) => c.plan).filter(Boolean)));
  const availableGoals = Array.from(new Set(candidates.map((c) => c.health_goal).filter(Boolean)));

  // Filtered Nutritionists for Batch Modal (Step 1)
  const filteredNutritionists = nutritionists.filter((n) => {
    if (batchNutriTypeFilter !== "all" && n.nutritionist_type !== batchNutriTypeFilter) return false;
    if (batchNutriCaseloadFilter === "light" && n.caseload_count >= 15) return false;
    if (batchNutriCaseloadFilter === "heavy" && n.caseload_count < 15) return false;
    if (!batchNutriSearch) return true;
    const term = batchNutriSearch.toLowerCase().trim();
    return (
      (n.full_name && n.full_name.toLowerCase().includes(term)) ||
      (n.email && n.email.toLowerCase().includes(term)) ||
      (n.current_organization && n.current_organization.toLowerCase().includes(term)) ||
      (n.qualification && n.qualification.toLowerCase().includes(term))
    );
  });

  // Filtered Patients for Batch Modal (Step 2)
  const filteredPatients = candidates.filter((p) => {
    // 1. Status Filter
    if (batchPatientFilter === "unassigned" && p.assigned_nutritionist_id) return false;
    if (batchPatientFilter === "assigned" && !p.assigned_nutritionist_id) return false;

    // 2. Current Clinician Filter
    if (batchPatientNutriFilter !== "all" && String(p.assigned_nutritionist_id) !== String(batchPatientNutriFilter)) {
      return false;
    }

    // 3. Plan Filter
    if (batchPatientPlanFilter !== "all" && (p.plan || "").toLowerCase() !== batchPatientPlanFilter.toLowerCase()) {
      return false;
    }

    // 4. Goal Filter
    if (batchPatientGoalFilter !== "all" && (p.health_goal || "").toLowerCase() !== batchPatientGoalFilter.toLowerCase()) {
      return false;
    }

    // 5. Search text (name, email, phone, city, goal, current doctor)
    if (!batchPatientSearch) return true;
    const term = batchPatientSearch.toLowerCase().trim();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.phone_number && p.phone_number.toLowerCase().includes(term)) ||
      (p.city && p.city.toLowerCase().includes(term)) ||
      (p.health_goal && p.health_goal.toLowerCase().includes(term)) ||
      (p.diet_type && p.diet_type.toLowerCase().includes(term)) ||
      (p.assigned_nutritionist_name && p.assigned_nutritionist_name.toLowerCase().includes(term))
    );
  });

  // Filtered Nutritionists for Caseloads Tab (Tab 2)
  const filteredCaseloadNutritionists = nutritionists
    .filter((n) => {
      if (caseloadTypeFilter !== "all" && n.nutritionist_type !== caseloadTypeFilter) return false;
      if (caseloadLevelFilter === "light" && n.caseload_count >= 10) return false;
      if (caseloadLevelFilter === "medium" && (n.caseload_count < 10 || n.caseload_count > 30)) return false;
      if (caseloadLevelFilter === "heavy" && n.caseload_count <= 30) return false;
      if (!caseloadSearch) return true;
      const term = caseloadSearch.toLowerCase().trim();
      return (
        (n.full_name && n.full_name.toLowerCase().includes(term)) ||
        (n.email && n.email.toLowerCase().includes(term)) ||
        (n.current_organization && n.current_organization.toLowerCase().includes(term)) ||
        (n.qualification && n.qualification.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      if (caseloadSort === "desc") return b.caseload_count - a.caseload_count;
      if (caseloadSort === "asc") return a.caseload_count - b.caseload_count;
      if (caseloadSort === "name") return (a.full_name || "").localeCompare(b.full_name || "");
      return 0;
    });

  // Filtered Nutritionists for Reassign Modal
  const filteredReassignNutritionists = nutritionists.filter((n) => {
    if (reassignTypeFilter !== "all" && n.nutritionist_type !== reassignTypeFilter) return false;
    if (!reassignSearch) return true;
    const term = reassignSearch.toLowerCase().trim();
    return (
      (n.full_name && n.full_name.toLowerCase().includes(term)) ||
      (n.email && n.email.toLowerCase().includes(term)) ||
      (n.current_organization && n.current_organization.toLowerCase().includes(term))
    );
  });

  // Toggle patient selection in batch modal
  const toggleBatchPatient = (pid) => {
    setBatchPatientIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  // Select all visible unassigned or all patients in batch modal
  const handleSelectAllBatch = (patientList) => {
    if (batchPatientIds.size === patientList.length) {
      setBatchPatientIds(new Set());
    } else {
      setBatchPatientIds(new Set(patientList.map((p) => p.id)));
    }
  };

  // Submit Batch Assignment
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchNutriId) {
      showToast("Please select a target nutritionist.", "error");
      return;
    }
    if (batchPatientIds.size === 0) {
      showToast("Please select at least one patient to assign.", "error");
      return;
    }

    const targetNutri = nutritionists.find((n) => String(n.id) === String(batchNutriId));
    const confirmText = `Assign ${batchPatientIds.size} patient(s) to ${targetNutri?.full_name || "selected nutritionist"}?`;
    if (!window.confirm(confirmText)) return;

    setActionLoading(true);
    try {
      const res = await api.batchAssignPatients(Number(batchNutriId), Array.from(batchPatientIds));
      if (res.status === "success") {
        showToast(res.message || "Patients assigned successfully!");
        setShowBatchModal(false);
        setBatchPatientIds(new Set());
        loadData();
      }
    } catch (err) {
      showToast(err.message || "Failed to assign patients.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Reassign
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newNutriId || !reassignTarget) return;

    setActionLoading(true);
    try {
      const res = await api.batchAssignPatients(Number(newNutriId), [reassignTarget.patient.id]);
      if (res.status === "success") {
        showToast(`Reassigned ${reassignTarget.patient.full_name} successfully!`);
        setReassignTarget(null);
        setNewNutriId("");
        loadData();
      }
    } catch (err) {
      showToast(err.message || "Failed to reassign patient.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Unassign
  const handleUnassignSubmit = async () => {
    if (!unassignTarget) return;

    setActionLoading(true);
    try {
      const res = await api.unassignPatients([unassignTarget.patient.id]);
      if (res.status === "success") {
        showToast(`Unassigned ${unassignTarget.patient.full_name} successfully.`);
        setUnassignTarget(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || "Failed to unassign patient.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-slate-50/60 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold text-white animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "error" ? "bg-rose-600" : "bg-slate-900"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-500/20">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Patient Assignment & Caseloads
                </h1>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Batch assign patients to clinical nutritionists, balance practitioner caseloads & track assignments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Refresh assignments"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => openBatchAssign()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md shadow-orange-500/20"
          >
            <UserPlus size={16} />
            Batch Assign Patients
          </button>
        </div>
      </div>

      {/* Executive Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.total_patients}
          </div>
          <span className="text-xs text-slate-400 font-medium block">
            Health tracking accounts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Patients</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {metrics.assigned_patients}
          </div>
          <span className="text-xs text-slate-400 font-medium block">
            Linked to active nutritionists
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unassigned Patients</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserMinus size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.unassigned_patients}
          </div>
          <span className="text-xs text-slate-400 font-medium block">
            {metrics.unassigned_patients === 0 ? "All patients assigned" : "Awaiting clinician allocation"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Nutritionists</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stethoscope size={16} />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.total_nutritionists} Clinicians
          </div>
          <span className="text-xs text-slate-400 font-medium block">
            Avg {metrics.avg_caseload} patients / clinician
          </span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Tab Navigation & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          {/* Segmented Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl shrink-0">
            {[
              { id: "assigned", label: `Assigned Patients (${totalAssigned})`, icon: UserCheck },
              { id: "nutritionists", label: `Nutritionist Caseloads (${nutritionists.length})`, icon: Stethoscope },
              { id: "unassigned", label: `Unassigned Queue (${metrics.unassigned_patients})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-orange-500" : ""} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Nutritionist Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === "assigned" && (
              <>
                <select
                  value={selectedNutriFilter}
                  onChange={(e) => {
                    setSelectedNutriFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer"
                >
                  <option value="">All Clinicians ({nutritionists.length})</option>
                  {nutritionists.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.full_name} ({n.caseload_count} patients)
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPlanFilter}
                  onChange={(e) => {
                    setSelectedPlanFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer"
                >
                  <option value="">All Plans</option>
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="vip">VIP Plan</option>
                </select>
              </>
            )}

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, phone, doctor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 w-48 sm:w-60"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Filter
              </button>
              {(search || selectedNutriFilter || selectedPlanFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedNutriFilter("");
                    setSelectedPlanFilter("");
                    setPage(1);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Clear all filters"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Active Filter Chips Strip for Assigned Tab */}
        {activeTab === "assigned" && (search || selectedNutriFilter || selectedPlanFilter) && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wide">Active Filters:</span>
            {selectedNutriFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                Clinician: {nutritionists.find(n => String(n.id) === String(selectedNutriFilter))?.full_name || `#${selectedNutriFilter}`}
                <button onClick={() => { setSelectedNutriFilter(""); setPage(1); }} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedPlanFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 capitalize">
                Plan: {selectedPlanFilter}
                <button onClick={() => { setSelectedPlanFilter(""); setPage(1); }} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                Query: "{search}"
                <button onClick={() => { setSearch(""); setPage(1); }} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setSelectedNutriFilter("");
                setSelectedPlanFilter("");
                setPage(1);
              }}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer ml-1"
            >
              Reset All
            </button>
          </div>
        )}

        {/* TAB 1: ASSIGNED PATIENTS LIST */}
        {activeTab === "assigned" && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Patient Identity</th>
                    <th className="py-3.5 px-4">Health Goal / Diet</th>
                    <th className="py-3.5 px-4">Assigned Nutritionist</th>
                    <th className="py-3.5 px-4 text-center">Assigned Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-2" />
                        <span className="font-semibold text-xs">Loading patient assignments...</span>
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <Users size={36} className="text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">No assigned patients found</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting your search query or nutritionist filter.</p>
                      </td>
                    </tr>
                  ) : (
                    assignments.map((item) => {
                      const p = item.patient;
                      const n = item.nutritionist;
                      return (
                        <tr key={item.assignment_id} className="hover:bg-slate-50/60 transition">
                          {/* Patient */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {(p.full_name || "P").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{p.full_name}</span>
                                <span className="text-xs text-slate-400 block truncate max-w-xs">{p.email}</span>
                                {p.phone_number && (
                                  <span className="text-[11px] text-slate-400 block font-mono">{p.phone_number}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Health Goal */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800 text-xs block">
                              {p.health_goal || "General Health Tracking"}
                            </span>
                            <span className="text-[11px] text-slate-400 capitalize block mt-0.5">
                              {p.diet_type ? `Diet: ${p.diet_type}` : "Standard Diet"}
                            </span>
                          </td>

                          {/* Nutritionist */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {(n.full_name || "D").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{n.full_name}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                                    n.nutritionist_type === "inhouse" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-purple-50 text-purple-700 border-purple-200"
                                  }`}>
                                    {n.nutritionist_type === "inhouse" ? "In-House" : "Expert"}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 truncate block max-w-xs">{n.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Date */}
                          <td className="py-4 px-4 text-center">
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {item.assigned_at || "Active"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReassignTarget({
                                    assignment_id: item.assignment_id,
                                    patient: p,
                                    current_nutri: n,
                                  });
                                  setNewNutriId("");
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Reassign
                              </button>
                              <button
                                onClick={() => {
                                  setUnassignTarget({
                                    assignment_id: item.assignment_id,
                                    patient: p,
                                    nutritionist: n,
                                  });
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Unassign
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Showing page {page} of {totalPages} ({totalAssigned} assignments)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-bold text-slate-900 px-2">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NUTRITIONIST CASELOAD BREAKDOWN */}
        {activeTab === "nutritionists" && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Caseload Filter & Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
              {/* Type Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: "all", label: `All Clinicians (${nutritionists.length})` },
                  { id: "inhouse", label: `🏢 In-House (${nutritionists.filter(n => n.nutritionist_type === "inhouse").length})` },
                  { id: "expert", label: `🌟 Expert Specialist (${nutritionists.filter(n => n.nutritionist_type === "expert").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCaseloadTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      caseloadTypeFilter === f.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Caseload Level & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={caseloadLevelFilter}
                  onChange={(e) => setCaseloadLevelFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer"
                >
                  <option value="all">All Caseload Levels</option>
                  <option value="light">🟢 Light (&lt; 10 patients)</option>
                  <option value="medium">🟡 Medium (10–30 patients)</option>
                  <option value="heavy">🔴 Heavy (&gt; 30 patients)</option>
                </select>

                <select
                  value={caseloadSort}
                  onChange={(e) => setCaseloadSort(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer"
                >
                  <option value="desc">Highest Caseload</option>
                  <option value="asc">Lowest Caseload</option>
                  <option value="name">Clinician Name A–Z</option>
                </select>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clinician or clinic..."
                    value={caseloadSearch}
                    onChange={(e) => setCaseloadSearch(e.target.value)}
                    className="pl-8 pr-7 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 w-44 sm:w-56"
                  />
                  {caseloadSearch && (
                    <button
                      onClick={() => setCaseloadSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nutritionists Caseload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaseloadNutritionists.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                  <p className="font-bold text-slate-700 text-sm">No clinicians match your filter criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the caseload filter or search query.</p>
                </div>
              ) : (
                filteredCaseloadNutritionists.map((nutri) => (
                  <div
                    key={nutri.id}
                    className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-orange-300 transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                            {(nutri.full_name || "N").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                              {nutri.full_name}
                            </h4>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border inline-block mt-1 ${
                              nutri.nutritionist_type === "inhouse" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>
                              {nutri.nutritionist_type === "inhouse" ? "🏢 In-House Staff" : "🌟 Specialist Expert"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-900 block leading-none">
                            {nutri.caseload_count}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Patients
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-200/60">
                        <p className="truncate"><span className="text-slate-400 font-semibold">Email:</span> {nutri.email}</p>
                        {nutri.qualification && (
                          <p className="truncate"><span className="text-slate-400 font-semibold">Degree:</span> {nutri.qualification}</p>
                        )}
                        {nutri.current_organization && (
                          <p className="truncate"><span className="text-slate-400 font-semibold">Hospital:</span> {nutri.current_organization}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedNutriFilter(String(nutri.id));
                          setActiveTab("assigned");
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                      >
                        View Caseload ({nutri.caseload_count})
                      </button>
                      <button
                        onClick={() => openBatchAssign(nutri.id)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <UserPlus size={13} />
                        Assign Patients
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UNASSIGNED QUEUE */}
        {activeTab === "unassigned" && (
          <div className="p-6 sm:p-8 space-y-4">
            {unassignedList.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">Unassigned Queue is Empty</h4>
                <p className="text-xs text-slate-400 mt-1">All active platform patients have been successfully linked to a clinical nutritionist.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {unassignedList.length} Patients without nutritionist assignment
                  </span>
                  <button
                    onClick={() => openBatchAssign()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus size={14} /> Batch Assign Queue
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unassignedList.map((p) => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0">
                          {(p.full_name || "P").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-900 text-sm truncate">{p.full_name}</h4>
                          <span className="text-xs text-slate-400 truncate block">{p.email}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p><span className="text-slate-400 font-semibold">Goal:</span> {p.health_goal || "General Health"}</p>
                        <p><span className="text-slate-400 font-semibold">Plan:</span> {p.plan || "Basic"}</p>
                      </div>
                      <button
                        onClick={() => {
                          setBatchNutriId(nutritionists[0]?.id ? String(nutritionists[0].id) : "");
                          setBatchPatientIds(new Set([p.id]));
                          setShowBatchModal(true);
                        }}
                        className="w-full py-2 bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserPlus size={13} /> Assign Nutritionist
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BATCH ASSIGNMENT POPUP MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-slate-50/40 to-white flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                  Batch Dispatch
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Assign Multiple Patients to Nutritionist
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Select a practitioner and check off the patients you wish to assign or reassign in bulk.
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBatchSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Step 1: Select Nutritionist */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                      Step 1: Select Target Nutritionist
                    </label>
                    <p className="text-xs text-slate-400">
                      Choose the clinical practitioner who will receive the patient caseload
                    </p>
                  </div>

                  {/* Nutritionist Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search nutritionist by name, clinic..."
                      value={batchNutriSearch}
                      onChange={(e) => setBatchNutriSearch(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                    />
                    {batchNutriSearch && (
                      <button
                        type="button"
                        onClick={() => setBatchNutriSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nutritionist Filter Pills (Type & Caseload) */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[
                    { id: "all", label: `All Clinicians (${nutritionists.length})` },
                    { id: "inhouse", label: `🏢 In-House (${nutritionists.filter(n => n.nutritionist_type === "inhouse").length})` },
                    { id: "expert", label: `🌟 Expert Specialist (${nutritionists.filter(n => n.nutritionist_type === "expert").length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBatchNutriTypeFilter(f.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        batchNutriTypeFilter === f.id
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <span className="text-slate-300">|</span>

                  {[
                    { id: "all", label: "All Caseloads" },
                    { id: "light", label: "🟢 Light (< 15)" },
                    { id: "heavy", label: "🔴 Heavy (15+)" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBatchNutriCaseloadFilter(c.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        batchNutriCaseloadFilter === c.id
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Nutritionists Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-52 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/40">
                  {filteredNutritionists.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                      No nutritionist matches "{batchNutriSearch}".
                    </div>
                  ) : (
                    filteredNutritionists.map((nutri) => {
                      const isSelected = String(batchNutriId) === String(nutri.id);
                      return (
                        <div
                          key={nutri.id}
                          onClick={() => setBatchNutriId(String(nutri.id))}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-orange-50 border-orange-400 shadow-sm"
                              : "bg-white border-slate-200/80 hover:border-slate-300"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {nutri.full_name}
                            </p>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {nutri.nutritionist_type === "inhouse" ? "🏢 In-House" : "🌟 Expert"} · {nutri.caseload_count} patients
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Nutritionist Target Preview */}
                {batchNutriId && (() => {
                  const sel = nutritionists.find((n) => String(n.id) === String(batchNutriId));
                  if (!sel) return null;
                  return (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-orange-50/80 border border-orange-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles size={14} className="text-orange-500 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">
                          Target Practitioner: {sel.full_name}
                        </span>
                        <span className="text-slate-500 text-[11px] shrink-0">
                          ({sel.nutritionist_type === "inhouse" ? "🏢 In-House" : "🌟 Expert Specialist"})
                        </span>
                      </div>
                      <span className="text-slate-600 shrink-0 font-medium ml-2">
                        Current Caseload: <strong className="text-orange-600 font-bold">{sel.caseload_count}</strong>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Step 2: Select Patients */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                      Step 2: Choose Patients to Link
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600">
                        {batchPatientIds.size} Selected
                      </span>
                      <span className="text-xs text-slate-400">
                        ({filteredPatients.length} visible of {candidates.length} total)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Patient Search Bar */}
                    <div className="relative w-full sm:w-72">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search patient name, email, phone, city..."
                        value={batchPatientSearch}
                        onChange={(e) => setBatchPatientSearch(e.target.value)}
                        className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      />
                      {batchPatientSearch && (
                        <button
                          type="button"
                          onClick={() => setBatchPatientSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAllBatch(filteredPatients)}
                      className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer"
                    >
                      {batchPatientIds.size === filteredPatients.length && filteredPatients.length > 0
                        ? "Deselect Visible"
                        : "Select All Visible"}
                    </button>

                    {batchPatientIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setBatchPatientIds(new Set())}
                        className="px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Clear all selected patients"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Filter Controls Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                      { id: "all", label: `All Candidates (${candidates.length})` },
                      { id: "unassigned", label: `Unassigned (${candidates.filter(c => !c.assigned_nutritionist_id).length})` },
                      { id: "assigned", label: `Assigned (${candidates.filter(c => c.assigned_nutritionist_id).length})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setBatchPatientFilter(f.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          batchPatientFilter === f.id
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Filter by Current Clinician */}
                  <select
                    value={batchPatientNutriFilter}
                    onChange={(e) => setBatchPatientNutriFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer max-w-48 truncate"
                  >
                    <option value="all">All Current Clinicians</option>
                    {nutritionists.filter(n => n.caseload_count > 0).map((n) => (
                      <option key={n.id} value={n.id}>
                        Currently: {n.full_name} ({n.caseload_count})
                      </option>
                    ))}
                  </select>

                  {/* Filter by Plan */}
                  <select
                    value={batchPatientPlanFilter}
                    onChange={(e) => setBatchPatientPlanFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Plans</option>
                    {availablePlans.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>

                  {/* Filter by Goal */}
                  <select
                    value={batchPatientGoalFilter}
                    onChange={(e) => setBatchPatientGoalFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-slate-700 cursor-pointer max-w-44 truncate"
                  >
                    <option value="all">All Health Goals</option>
                    {availableGoals.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  {(batchPatientSearch || batchPatientFilter !== "all" || batchPatientNutriFilter !== "all" || batchPatientPlanFilter !== "all" || batchPatientGoalFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setBatchPatientSearch("");
                        setBatchPatientFilter("all");
                        setBatchPatientNutriFilter("all");
                        setBatchPatientPlanFilter("all");
                        setBatchPatientGoalFilter("all");
                      }}
                      className="px-2 py-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg cursor-pointer ml-auto"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Patient Multi-Select List */}
                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
                  {filteredPatients.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      No patients match your search and filter criteria.
                    </div>
                  ) : (
                    filteredPatients.map((p) => {
                      const isSelected = batchPatientIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleBatchPatient(p.id)}
                          className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                            isSelected ? "bg-orange-50/70 border-l-4 border-l-orange-500" : "hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400 cursor-pointer"
                            />
                            <div className="w-9 h-9 rounded-xl bg-slate-100 font-black text-slate-600 text-xs flex items-center justify-center shrink-0">
                              {(p.full_name || "P").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {p.full_name || "Unnamed Patient"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
                              </div>
                              <span className="text-xs text-slate-400 block truncate">
                                {p.email} {p.phone_number ? `· ${p.phone_number}` : ""} {p.city ? `· ${p.city}` : ""}
                              </span>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {p.assigned_nutritionist_name ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                                    <UserCheck size={11} className="text-slate-400" />
                                    Currently: <strong className="text-slate-900">{p.assigned_nutritionist_name}</strong>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                    <AlertCircle size={11} />
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-slate-600 block">
                              {p.health_goal || "General Health"}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Plan: <strong className="text-slate-700">{p.plan || "Basic"}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {batchPatientIds.size} patient(s) ready to be linked
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || batchPatientIds.size === 0 || !batchNutriId}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-40 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Assign {batchPatientIds.size} Patient(s)
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN POPUP MODAL */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Reassign Patient: {reassignTarget.patient.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Currently assigned to: <strong className="text-slate-800">{reassignTarget.current_nutri.full_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setReassignTarget(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Select New Nutritionist
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search nutritionist by name or clinic..."
                    value={reassignSearch}
                    onChange={(e) => setReassignSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                  />
                </div>
                <select
                  value={newNutriId}
                  onChange={(e) => setNewNutriId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Choose Nutritionist ({filteredReassignNutritionists.length} matches) --</option>
                  {filteredReassignNutritionists.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.full_name} ({n.caseload_count} patients, {n.nutritionist_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newNutriId}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  Confirm Reassign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNASSIGN CONFIRMATION MODAL */}
      {unassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <UserMinus size={28} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Unassign Patient?
                </h3>
                <p className="text-xs text-slate-500">
                  Remove assignment linkage between <strong>{unassignTarget.patient.full_name}</strong> and <strong>{unassignTarget.nutritionist.full_name}</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-800">
                The patient will return to the unassigned queue until a new nutritionist is assigned.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnassignTarget(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnassignSubmit}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                  Confirm Unassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

