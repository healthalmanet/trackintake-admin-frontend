import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, ShieldAlert, Award, Building2, CheckCircle2,
  XCircle, Search, Filter, RefreshCw, Loader2, ArrowRight,
  FileText, ExternalLink, IndianRupee, Clock, Check, X, Eye,
  Sparkles, Stethoscope, ChevronLeft, ChevronRight, UserCheck,
  Globe, AlertTriangle, Phone, Mail, MapPin, Calendar, BookOpen,
  User, Layers, Tag, Video, Building, CreditCard, Crown, Heart
} from "lucide-react";
import { getApprovals, executeApprovalAction } from "../api/approvals";
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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

export default function ApproveProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [metrics, setMetrics] = useState({
    pending_nutritionists: 0,
    verified_nutritionists: 0,
    pending_price_reviews: 0,
    inactive_users_count: 0,
    total_profiles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [modalTab, setModalTab] = useState("overview");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [unverifyTarget, setUnverifyTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfiles = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getApprovals({
        category: categoryFilter,
        status: statusFilter,
        search,
      }, page, 12);

      if (data && data.status === "success") {
        setProfiles(data.results || []);
        if (data.metrics) setMetrics(data.metrics);
        setTotalPages(data.total_pages || 1);
        setTotalFiltered(data.total || 0);
      }
    } catch (err) {
      console.error("Fetch approvals error:", err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = async (profileId, action, extra = {}) => {
    setActionLoading(true);
    try {
      const res = await executeApprovalAction(profileId, action, extra);
      showToast(res.message || "Action completed successfully");
      setShowRejectInput(false);
      setRejectionReason("");
      setVerifyTarget(null);
      setUnverifyTarget(null);
      if (action === "verify") {
        setSelectedProfile(prev => prev ? { ...prev, is_verified: true, verified_at: new Date().toISOString() } : null);
      } else if (action === "unverify") {
        setSelectedProfile(prev => prev ? { ...prev, is_verified: false, verified_at: null } : null);
      } else if (action === "approve_price") {
        setSelectedProfile(prev => prev ? { ...prev, price_approval_status: "approved", pending_online_price: null } : null);
      }
      fetchProfiles();
    } catch (err) {
      showToast(err.message || "Failed to execute action", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white animate-in slide-in-from-bottom-3 duration-200 ${
          toast.type === "error" ? "bg-rose-600" : "bg-slate-900"
        }`}>
          {toast.type === "error" ? <XCircle size={17} /> : <CheckCircle2 size={17} className="text-emerald-400" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 cursor-pointer"><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Credential Audit & Verification
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {metrics.total_profiles} Specialists Registered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Profile & Credential Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review clinical certifications, verify government medical IDs & approve practitioner consultation pricing
          </p>
        </div>
        <button
          onClick={() => fetchProfiles(true)}
          disabled={refreshing || loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
          Refresh
        </button>
      </div>

      {/* Executive Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Pending Verification",
            value: metrics.pending_nutritionists,
            sub: "Requires admin review",
            icon: ShieldAlert,
            color: "text-amber-600",
            border: "border-amber-200",
            bg: "bg-amber-50 text-amber-700",
            active: statusFilter === "pending" && categoryFilter !== "price",
            onClick: () => { setStatusFilter("pending"); setCategoryFilter("all"); setPage(1); }
          },
          {
            label: "Verified Clinicians",
            value: metrics.verified_nutritionists,
            sub: "Active practitioners",
            icon: CheckCircle2,
            color: "text-emerald-600",
            border: "border-emerald-200",
            bg: "bg-emerald-50 text-emerald-700",
            active: statusFilter === "approved" && categoryFilter !== "price",
            onClick: () => { setStatusFilter("approved"); setCategoryFilter("all"); setPage(1); }
          },
          {
            label: "Price Adjustments",
            value: metrics.pending_price_reviews,
            sub: "Fee change requests",
            icon: IndianRupee,
            color: "text-purple-600",
            border: "border-purple-200",
            bg: "bg-purple-50 text-purple-700",
            active: categoryFilter === "price",
            onClick: () => { setCategoryFilter("price"); setStatusFilter("all"); setPage(1); }
          },
          {
            label: "Total Specialists",
            value: metrics.total_profiles,
            sub: "Registered providers",
            icon: Award,
            color: "text-blue-600",
            border: "border-blue-200",
            bg: "bg-blue-50 text-blue-700",
            active: statusFilter === "all" && categoryFilter === "all",
            onClick: () => { setStatusFilter("all"); setCategoryFilter("all"); setPage(1); }
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

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Pending Verification", status: "pending", category: "all" },
          { label: "Verified Clinicians", status: "approved", category: "all" },
          { label: "In-House Nutritionists", status: "all", category: "inhouse" },
          { label: "Expert Specialists", status: "all", category: "expert" },
          { label: "Price Change Requests", status: "all", category: "price" },
          { label: "All Specialists", status: "all", category: "all" },
        ].map((pill) => {
          const isActive = statusFilter === pill.status && categoryFilter === pill.category;
          return (
            <button
              key={pill.label}
              onClick={() => {
                setStatusFilter(pill.status);
                setCategoryFilter(pill.category);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search practitioner by name, email, qualification, reg number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved & Verified</option>
            <option value="all">All Verification Statuses</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">All Specialties</option>
            <option value="inhouse">In-House Nutritionists</option>
            <option value="expert">Expert Specialists</option>
            <option value="nutritionist">All Nutritionists</option>
            <option value="price">Price Changes Only</option>
          </select>
        </div>
      </div>

      {/* Profiles Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-200/80">
          <Loader2 size={36} className="animate-spin text-orange-500 mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading specialist credentials for audit...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200/80 text-center p-6">
          <ShieldCheck size={48} className="text-emerald-500 mb-3" />
          <h3 className="text-base font-black text-slate-900">All Credentials Reviewed!</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium">
            There are no profiles pending audit under this filter. Switch between Pending and Approved to inspect records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isExpert = (p.nutritionist_type || "").toLowerCase().includes("expert");
            const initials = (p.full_name || "N").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top Bar: Name & Verification Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-400 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                          {p.full_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate font-medium">{p.professional_title || "Nutrition Practitioner"}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0 border ${
                      p.is_verified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {p.is_verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      isExpert ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-sky-50 text-sky-700 border-sky-200"
                    }`}>
                      {isExpert ? "⭐ Specialist Expert" : "🏢 In-House Clinician"}
                    </span>
                    {p.qualification && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {p.qualification}
                      </span>
                    )}
                    {p.years_of_experience > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {p.years_of_experience} yrs exp
                      </span>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Registered:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar size={11} className="text-orange-500" />
                        {formatDate(p.date_joined || p.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{p.email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Session Fee:</span>
                      <span className="font-extrabold text-slate-900">₹{p.online_price || 0} online</span>
                    </div>
                    {p.pending_online_price && (
                      <div className="flex justify-between text-purple-700 font-bold bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                        <span>New Rate Requested:</span>
                        <span>₹{p.pending_online_price}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">License / Reg:</span>
                      <span className="font-mono text-slate-700 font-semibold">{p.registration_number || "Not listed"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedProfile(p);
                      setModalTab("overview");
                      setShowRejectInput(false);
                      setRejectionReason("");
                    }}
                    className="flex-1 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye size={13} /> Review Details
                  </button>

                  {!p.is_verified ? (
                    <button
                      onClick={() => setVerifyTarget(p)}
                      disabled={actionLoading}
                      className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check size={13} /> Verify
                    </button>
                  ) : (
                    <button
                      onClick={() => setUnverifyTarget(p)}
                      disabled={actionLoading}
                      className="py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Unverify
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {profiles.length} of {totalFiltered} profiles</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-800 px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Full Review Modal */}
      {selectedProfile && (() => {
        const documentsList = [
          {
            key: "qualification_certificate",
            label: "Degree Qualification Certificate",
            sub: "Primary medical/clinical degree or master's certificate",
            url: resolveDocUrl(selectedProfile.qualification_certificate || selectedProfile.documents?.qualification_certificate),
            rawPath: selectedProfile.qualification_certificate || selectedProfile.documents?.qualification_certificate,
          },
          {
            key: "government_id",
            label: "Government Photo ID Document",
            sub: "Official national identification (Aadhaar / Passport / DL)",
            url: resolveDocUrl(selectedProfile.government_id || selectedProfile.documents?.government_id),
            rawPath: selectedProfile.government_id || selectedProfile.documents?.government_id,
          },
          {
            key: "registration_certificate",
            label: "Medical / Dietetic Council Certificate",
            sub: "Accreditation certificate from state or national medical council",
            url: resolveDocUrl(selectedProfile.registration_certificate || selectedProfile.documents?.registration_certificate),
            rawPath: selectedProfile.registration_certificate || selectedProfile.documents?.registration_certificate,
          },
          {
            key: "experience_certificate",
            label: "Clinical Experience Certificate",
            sub: "Hospital appointment letter or experience verification document",
            url: resolveDocUrl(selectedProfile.experience_certificate || selectedProfile.documents?.experience_certificate),
            rawPath: selectedProfile.experience_certificate || selectedProfile.documents?.experience_certificate,
          },
        ];

        const uploadedDocsCount = documentsList.filter(d => Boolean(d.url)).length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl xl:max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-100">
              {/* Modal Header */}
              <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/80 via-slate-50/60 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    {(selectedProfile.full_name || "N").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-black text-2xl sm:text-3xl text-slate-900 leading-tight">
                        {selectedProfile.full_name}
                      </h3>
                      <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${
                        selectedProfile.is_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {selectedProfile.is_verified ? "✓ Verified Staff" : "⏳ Pending Review"}
                      </span>
                      <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${
                        selectedProfile.nutritionist_type === "inhouse" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {selectedProfile.nutritionist_type === "inhouse" ? "🏢 In-House" : "🌟 Expert Specialist"}
                      </span>
                      {selectedProfile.pending_online_price && (
                        <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
                          Price Review Needed
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-orange-600">
                      {selectedProfile.professional_title || "Clinical Nutritionist & Dietitian"}
                      {selectedProfile.current_organization && (
                        <span className="text-slate-600 font-semibold"> · {selectedProfile.current_organization}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1.5 text-slate-800 font-bold bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-lg">
                        <Calendar size={14} className="text-orange-500" />
                        <span>Registered: {formatDate(selectedProfile.date_joined || selectedProfile.created_at)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Mail size={14} className="text-orange-500" />
                        <a href={`mailto:${selectedProfile.email}`} className="hover:underline hover:text-orange-600 font-semibold">{selectedProfile.email}</a>
                      </span>
                      {selectedProfile.phone_number && (
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={14} className="text-emerald-500" />
                          <a href={`tel:${selectedProfile.phone_number}`} className="hover:underline hover:text-emerald-600 font-semibold">{selectedProfile.phone_number}</a>
                        </span>
                      )}
                      {(selectedProfile.city || selectedProfile.country) && (
                        <span className="flex items-center gap-1.5 text-slate-700 capitalize">
                          <MapPin size={14} className="text-blue-500" />
                          <span className="font-semibold">{[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProfile(null)}
                  className="self-end sm:self-center p-2.5 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Close modal"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Quick Clinical & Subscription Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 sm:p-5 bg-slate-50/80 border-b border-slate-100">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Clinical Experience</span>
                  <strong className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{selectedProfile.years_of_experience || 0} Years</strong>
                  <span className="text-xs text-slate-500 mt-0.5 block">Practicing clinician</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assigned Patients</span>
                  <strong className="text-xl sm:text-2xl font-black text-blue-600 mt-1 block">{selectedProfile.assigned_patients_count || 0} Patients</strong>
                  <span className="text-xs text-slate-500 mt-0.5 block">Active caseload</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Consultations Delivered</span>
                  <strong className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">{selectedProfile.total_appointments_count || 0} Sessions</strong>
                  <span className="text-xs text-slate-500 mt-0.5 block">Completed bookings</span>
                </div>
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">License Registration</span>
                  <strong className="text-base sm:text-lg font-mono font-black text-slate-900 mt-1 block truncate">
                    {selectedProfile.registration_number || "Not on file"}
                  </strong>
                  <span className="text-xs text-slate-500 truncate block mt-0.5">Council: <span className="font-semibold text-slate-700 uppercase">{selectedProfile.issuing_authority || "Medical Authority"}</span></span>
                </div>
                <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs ${
                  selectedProfile.active_subscription
                    ? "bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200"
                    : "bg-white border-slate-200"
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5 text-amber-600">
                    <Crown size={14} className="text-amber-500" /> Subscription Plan
                  </span>
                  <strong className="text-base sm:text-lg font-black text-slate-900 mt-1 block truncate">
                    {selectedProfile.active_subscription ? `${selectedProfile.active_subscription.plan_name} (₹${selectedProfile.active_subscription.price})` : "No Active Plan"}
                  </strong>
                  <span className={`text-xs font-semibold mt-0.5 block truncate ${selectedProfile.active_subscription ? "text-emerald-600" : "text-slate-400"}`}>
                    {selectedProfile.active_subscription
                      ? `✓ Active till ${formatDate(selectedProfile.active_subscription.end_date)}`
                      : "Free Platform Tier"}
                  </span>
                </div>
              </div>

              {/* Segmented Tab Navigation inside Modal */}
              <div className="px-6 sm:px-8 pt-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
                {[
                  { id: "overview", label: "Credentials & Clinical Profile", icon: Stethoscope },
                  { id: "specialties", label: `Specialties & Languages (${(selectedProfile.specializations || []).length})`, icon: Sparkles },
                  { id: "pricing", label: "Consultation Rates & Channels", icon: IndianRupee },
                  { id: "subscriptions", label: `Subscription & Billing (${(selectedProfile.subscriptions || []).length})`, icon: CreditCard },
                  { id: "documents", label: `Submitted Credentials (${uploadedDocsCount}/4)`, icon: FileText },
                  ...(selectedProfile.health_profile && (selectedProfile.health_profile.gender || selectedProfile.health_profile.height_cm || selectedProfile.health_profile.weight_kg)
                    ? [{ id: "health", label: "Health & Vitals", icon: Heart }]
                    : []),
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = modalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "border-orange-500 text-orange-600 bg-orange-50/20"
                          : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                {/* TAB 1: OVERVIEW & CREDENTIALS */}
                {modalTab === "overview" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Highest Clinical Qualification
                        </span>
                        <p className="text-base font-black text-slate-900">
                          {selectedProfile.qualification || "Qualification details pending"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {selectedProfile.years_of_experience || 0} Years Active Professional Experience
                        </p>
                      </div>

                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Current Hospital / Clinic Organization
                        </span>
                        <p className="text-base font-black text-slate-900">
                          {selectedProfile.current_organization || "Independent Practice / Consultant"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium capitalize">
                          Title: {selectedProfile.professional_title || "Clinical Nutritionist"}
                        </p>
                      </div>

                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Medical Registration & License Number
                        </span>
                        <p className="text-base font-mono font-black text-slate-900">
                          {selectedProfile.registration_number || "Not on file"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          Issuing Council: <span className="font-bold text-slate-700 uppercase">{selectedProfile.issuing_authority || "Medical Authority"}</span>
                        </p>
                      </div>

                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Platform Role & Classification
                        </span>
                        <p className="text-base font-black text-slate-900">
                          {selectedProfile.nutritionist_type === "inhouse" ? "In-House Staff Nutritionist" : "External Expert Specialist"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          User ID #{selectedProfile.user_id} · Registered: <span className="font-bold text-slate-700">{formatDate(selectedProfile.date_joined || selectedProfile.created_at)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Biography Card */}
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Professional Clinical Biography
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {selectedProfile.professional_bio || "No clinical biography entered by practitioner."}
                      </p>
                    </div>

                    {/* Additional Certifications */}
                    {selectedProfile.additional_certifications && (
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Additional Certifications & Fellowships
                        </span>
                        <p className="text-sm text-slate-700 font-medium">
                          {selectedProfile.additional_certifications}
                        </p>
                      </div>
                    )}

                    {/* Account Audit Card */}
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-wrap items-center justify-between text-sm gap-3">
                      <div className="flex items-center gap-2.5 text-blue-900 font-bold">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span>Audit Status:</span>
                        <span className={selectedProfile.is_verified ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                          {selectedProfile.is_verified ? "Practitioner is officially verified" : "Practitioner awaiting verification"}
                        </span>
                      </div>
                      {selectedProfile.verified_at && (
                        <span className="text-slate-500 text-xs font-medium">
                          Verified on: {new Date(selectedProfile.verified_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: SPECIALTIES & LANGUAGES */}
                {modalTab === "specialties" && (
                  <div className="space-y-5">
                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-sm font-black text-slate-900">Clinical Focus & Specializations</span>
                          <p className="text-xs text-slate-500">Diseases, conditions and clinical focus areas approved for consultation</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                          {(selectedProfile.specializations || []).length} Specialties
                        </span>
                      </div>

                      {(selectedProfile.specializations && selectedProfile.specializations.length > 0) ? (
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {selectedProfile.specializations.map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-2 rounded-xl bg-orange-50 text-orange-900 font-bold border border-orange-200 text-xs sm:text-sm shadow-2xs flex items-center gap-2"
                            >
                              <CheckCircle2 size={15} className="text-orange-500" />
                              {spec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 font-medium">
                          No clinical specializations entered yet.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-sm font-black text-slate-900">Languages Spoken for Consultations</span>
                          <p className="text-xs text-slate-500">Patient communication channels</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          {(selectedProfile.languages_spoken || []).length} Languages
                        </span>
                      </div>

                      {(selectedProfile.languages_spoken && selectedProfile.languages_spoken.length > 0) ? (
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {selectedProfile.languages_spoken.map((lang, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 text-xs sm:text-sm shadow-2xs capitalize flex items-center gap-2"
                            >
                              <Globe size={15} className="text-indigo-500" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm italic">English (Default)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: CONSULTATION RATES & PRACTICE */}
                {modalTab === "pricing" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Online Practice */}
                      <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Video size={16} className="text-blue-600" />
                            Online Telehealth Consultations
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            selectedProfile.is_online_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {selectedProfile.is_online_available ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Current Online Consultation Fee:</span>
                          <strong className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 block">
                            ₹{selectedProfile.online_price || 0}
                          </strong>
                          <span className="text-xs text-slate-500 mt-1 block">
                            Virtual Video Mode: <span className="font-semibold text-slate-700">{selectedProfile.is_virtual_enabled ? "Enabled" : "Chat/Audio"}</span>
                          </span>
                        </div>
                      </div>

                      {/* In-Clinic Practice */}
                      <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Building2 size={16} className="text-purple-600" />
                            In-Clinic Physical Practice
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            selectedProfile.is_offline_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {selectedProfile.is_offline_available ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">In-Clinic Consultation Fee:</span>
                          <strong className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 block">
                            ₹{selectedProfile.offline_price || 0}
                          </strong>
                          <span className="text-xs text-slate-500 block truncate mt-1">
                            Location: <span className="font-semibold text-slate-700">{selectedProfile.offline_location || "Clinic address on file"}</span>
                          </span>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            Payment: {selectedProfile.offline_payment_required ? "Advance payment required" : "Pay at physical clinic"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pending Price Request Card */}
                    {selectedProfile.pending_online_price ? (
                      <div className="p-6 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <IndianRupee size={18} className="text-purple-700" />
                            <span className="font-black text-purple-900 text-sm">Fee Revision Request Pending Admin Approval</span>
                          </div>
                          <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-purple-200 text-purple-900">
                            Requested Rate
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm bg-white p-4 rounded-xl border border-purple-100">
                          <div>
                            <span className="text-slate-400 text-xs font-bold uppercase block">Current Online Rate:</span>
                            <span className="text-lg font-black text-slate-700">₹{selectedProfile.online_price || 0}</span>
                          </div>
                          <ArrowRight size={18} className="text-purple-400" />
                          <div>
                            <span className="text-purple-700 text-xs font-bold uppercase block">Proposed New Online Rate:</span>
                            <span className="text-2xl font-black text-purple-900">₹{selectedProfile.pending_online_price}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-1">
                          <button
                            onClick={() => handleAction(selectedProfile.id, "reject_price", { reason: "Rate revision exceeded standard tier limits" })}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                          >
                            Decline Rate Request
                          </button>
                          <button
                            onClick={() => handleAction(selectedProfile.id, "approve_price")}
                            disabled={actionLoading}
                            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            Approve New Rate (₹{selectedProfile.pending_online_price})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-sm flex items-center justify-between">
                        <span>Price Status: All consultation rates are approved and locked.</span>
                        <span className="text-emerald-700 font-bold">✓ Standard Tier Approved</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SUBMITTED DOCUMENTS */}
                {modalTab === "documents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-sm font-black text-slate-900">Official Clinical Credentials & Certificates</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500">
                        <span className="text-orange-600 font-black">{uploadedDocsCount}</span> of 4 Verified Documents Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documentsList.map(({ label, sub, url, rawPath }) => (
                        <div
                          key={label}
                          className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                            url
                              ? "bg-white border-slate-200 shadow-2xs hover:border-orange-300"
                              : "bg-slate-50/70 border-slate-200/60"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  url ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-400"
                                }`}>
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900">{label}</h4>
                                  <p className="text-xs text-slate-400">{sub}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                url ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                              }`}>
                                {url ? "✓ Uploaded" : "Not Provided"}
                              </span>
                            </div>

                            {rawPath && (
                              <p className="text-xs font-mono text-slate-600 mt-2 truncate bg-slate-50 p-2 rounded-xl border border-slate-100">
                                Path: {rawPath}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer"
                              >
                                <ExternalLink size={15} />
                                Open & Inspect Document ↗
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-medium">No document file on record</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: SUBSCRIPTIONS & BILLING */}
                {modalTab === "subscriptions" && (
                  <div className="space-y-6">
                    {/* Active Subscription Banner */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Subscription Status</h4>
                      {selectedProfile.active_subscription ? (
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border border-amber-200 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                                <Crown size={24} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-lg font-black text-slate-900">{selectedProfile.active_subscription.plan_name}</h3>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Running Active
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 capitalize">
                                    {selectedProfile.active_subscription.plan_type || "Nutritionist"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Active Period: <strong className="text-slate-700">{formatDate(selectedProfile.active_subscription.start_date)}</strong> → <strong className="text-slate-700">{formatDate(selectedProfile.active_subscription.end_date)}</strong>
                                  {selectedProfile.active_subscription.duration_days > 0 && ` (${selectedProfile.active_subscription.duration_days} Days)`}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Plan Fee</span>
                              <strong className="text-2xl font-black text-slate-900">₹{selectedProfile.active_subscription.price}</strong>
                            </div>
                          </div>

                          {/* Quotas & Limits */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Max Assigned Patients</span>
                              <p className="text-base font-black text-slate-900 mt-0.5">
                                {selectedProfile.active_subscription.nutri_max_patients !== undefined && selectedProfile.active_subscription.nutri_max_patients !== null
                                  ? (selectedProfile.active_subscription.nutri_max_patients === 0 ? "Unlimited / Platform Default" : `${selectedProfile.active_subscription.nutri_max_patients} Patients`)
                                  : "Standard Quota"}
                              </p>
                            </div>
                            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">In-House Consults Remaining</span>
                              <p className="text-base font-black text-slate-900 mt-0.5">
                                {selectedProfile.active_subscription.remaining_inhouse ?? "—"}
                              </p>
                            </div>
                            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Expert Consults Remaining</span>
                              <p className="text-base font-black text-slate-900 mt-0.5">
                                {selectedProfile.active_subscription.remaining_expert ?? "—"}
                              </p>
                            </div>
                          </div>

                          {/* Features Granted */}
                          {selectedProfile.active_subscription.features && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Granted Feature Privileges</span>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { label: "AI Diet Plans", enabled: selectedProfile.active_subscription.features.ai_diet },
                                  { label: "Manual Diet Plans", enabled: selectedProfile.active_subscription.features.manual_diet },
                                  { label: "Chat Support", enabled: selectedProfile.active_subscription.features.chat },
                                  { label: "Online Telehealth", enabled: selectedProfile.active_subscription.features.online_appointment },
                                  { label: "In-Clinic Visits", enabled: selectedProfile.active_subscription.features.offline_appointment },
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
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                          <CreditCard size={36} className="text-slate-300 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-700">No Active Subscription</h4>
                          <p className="text-xs text-slate-400 mt-1">This nutritionist is currently on the free platform tier or has not purchased a subscription.</p>
                        </div>
                      )}
                    </div>

                    {/* All Subscriptions History Table */}
                    {selectedProfile.subscriptions && selectedProfile.subscriptions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subscription History ({selectedProfile.subscriptions.length})</h4>
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
                              {selectedProfile.subscriptions.map((sub, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-slate-900">{sub.plan_name}</td>
                                  <td className="p-3 font-semibold text-slate-700">₹{sub.price}</td>
                                  <td className="p-3 text-slate-500">{formatDate(sub.start_date)}</td>
                                  <td className="p-3 text-slate-500">{formatDate(sub.end_date)}</td>
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

                    {/* Payments History */}
                    {selectedProfile.payments && selectedProfile.payments.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Receipts & Transactions ({selectedProfile.payments.length})</h4>
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
                              {selectedProfile.payments.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono text-slate-700">
                                    <div className="font-bold">{p.payment_id || p.order_id || `#${p.id}`}</div>
                                    {p.order_id && p.payment_id && <div className="text-[10px] text-slate-400">{p.order_id}</div>}
                                  </td>
                                  <td className="p-3 font-medium text-slate-700">{p.plan_name || "Plan Purchase"}</td>
                                  <td className="p-3 font-black text-slate-900">₹{p.amount}</td>
                                  <td className="p-3 text-slate-500">{formatDate(p.created_at)}</td>
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

                {/* TAB 6: HEALTH & VITALS (IF AVAILABLE) */}
                {modalTab === "health" && selectedProfile.health_profile && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Health & Personal Vitals</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Gender</span>
                        <p className="text-base font-black text-slate-900 mt-1 capitalize">{selectedProfile.health_profile.gender || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Height</span>
                        <p className="text-base font-black text-slate-900 mt-1">{selectedProfile.health_profile.height_cm ? `${selectedProfile.health_profile.height_cm} cm` : "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Weight</span>
                        <p className="text-base font-black text-slate-900 mt-1">{selectedProfile.health_profile.weight_kg ? `${selectedProfile.health_profile.weight_kg} kg` : "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Diet Preference</span>
                        <p className="text-base font-black text-slate-900 mt-1 capitalize">{selectedProfile.health_profile.diet_type || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Activity Level</span>
                        <p className="text-base font-black text-slate-900 mt-1 capitalize">{selectedProfile.health_profile.activity_level || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Health Goal</span>
                        <p className="text-base font-black text-slate-900 mt-1 capitalize">{selectedProfile.health_profile.goal || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Reason Form (if opened) */}
              {showRejectInput && (
                <div className="p-5 bg-rose-50 border-t border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-900">Specify Reason for Rejection / Credential Revision</span>
                    <button onClick={() => setShowRejectInput(false)} className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Medical certificate blurry, registration number does not match council database..."
                    className="w-full px-4 py-2.5 text-sm bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAction(selectedProfile.id, "unverify", { reason: rejectionReason })}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Practitioner Status: <strong className="text-slate-900">{selectedProfile.is_verified ? "Verified Staff Practitioner" : "Pending Verification Review"}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>

                  {!selectedProfile.is_verified ? (
                    <>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={actionLoading}
                        className="px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                      >
                        Decline / Reject
                      </button>
                      <button
                        onClick={() => setVerifyTarget(selectedProfile)}
                        disabled={actionLoading}
                        className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        <Check size={16} /> Approve & Verify Practitioner
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setUnverifyTarget(selectedProfile)}
                      disabled={actionLoading}
                      className="px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition disabled:opacity-50 cursor-pointer"
                    >
                      Revoke Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VERIFY CONFIRMATION POPUP MODAL */}
      {verifyTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5">
              {/* Badge Icon */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/10">
                <ShieldCheck size={34} className="text-emerald-600" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Confirm Clinical Verification
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Grant verified medical staff credentials on the TrackIntake platform
                </p>
              </div>

              {/* Practitioner Summary Card */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                    {(verifyTarget.full_name || "N").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base text-slate-900 truncate">
                        {verifyTarget.full_name}
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        verifyTarget.nutritionist_type === "inhouse" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {verifyTarget.nutritionist_type === "inhouse" ? "🏢 In-House" : "🌟 Specialist Expert"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-orange-600 truncate mt-0.5">
                      {verifyTarget.qualification || verifyTarget.professional_title || "Clinical Nutritionist"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {verifyTarget.email} {verifyTarget.phone_number ? `· ${verifyTarget.phone_number}` : ""}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Medical Registration</span>
                    <span className="font-mono font-bold text-slate-800">
                      {verifyTarget.registration_number || "Not on file"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Licensing Council</span>
                    <span className="font-semibold text-slate-800 uppercase truncate block">
                      {verifyTarget.issuing_authority || "Medical Authority"}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Verification Entails */}
              <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100 text-xs text-emerald-900 space-y-1.5 font-medium">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Platform Verification Impact:</span>
                </div>
                <ul className="pl-6 space-y-1 list-disc text-slate-700 text-xs">
                  <li>Official <strong>Verified Staff</strong> badge will be permanently enabled on their profile.</li>
                  <li>Practitioner will become <strong>publicly discoverable</strong> by patients for consultation bookings.</li>
                  <li>Live session fee rates (Online: ₹{verifyTarget.online_price || 0} · In-Clinic: ₹{verifyTarget.offline_price || 0}) will be active for checkout.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyTarget(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs sm:text-sm text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(verifyTarget.id, "verify")}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Confirm & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNVERIFY CONFIRMATION POPUP MODAL */}
      {unverifyTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 sm:p-7 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-sm shadow-rose-500/10">
                <AlertTriangle size={34} className="text-rose-600" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Revoke Verification Status?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  This will remove the verified staff badge for {unverifyTarget.full_name}
                </p>
              </div>

              <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 text-xs text-rose-900 space-y-2 font-medium">
                <p>
                  Revoking verification will immediately:
                </p>
                <ul className="pl-5 space-y-1 list-disc text-slate-700">
                  <li>Remove the <strong>Verified Practitioner</strong> badge from platform listings.</li>
                  <li>Temporarily disable new patient appointment bookings for this clinician until re-audited.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnverifyTarget(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs sm:text-sm text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(unverifyTarget.id, "unverify")}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
