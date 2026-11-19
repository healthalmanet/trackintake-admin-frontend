import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee, CreditCard, RefreshCw, Search, Filter,
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowUpRight,
  ArrowDownLeft, Building2, User, Check, X, Eye, FileText,
  ChevronLeft, ChevronRight, Loader2, Sparkles, CheckSquare, Square
} from "lucide-react";
import {
  getPayables,
  updatePayable,
  getNutritionistPayablesHistory,
  bulkPayableAction
} from "../api/payables";

export default function Payables() {
  const [payables, setPayables] = useState([]);
  const [metrics, setMetrics] = useState({
    pending_payouts_count: 0,
    pending_payouts_total: 0,
    paid_payouts_count: 0,
    paid_payouts_total: 0,
    pending_refunds_count: 0,
    pending_refunds_total: 0,
    refunded_count: 0,
    refunded_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [viewType, setViewType] = useState("all"); // all, payouts, refunds
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Single Item Edit Modal
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [formData, setFormData] = useState({
    payout_status: "PAID",
    payout_amount: 0,
    payout_transaction_ref: "",
    payment_status: "REFUNDED",
    refund_amount: 0,
    refund_notes: "",
  });

  // Nutritionist Statement & Bulk Payout in One Go Modal
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [selectedStatementItemIds, setSelectedStatementItemIds] = useState([]);
  const [statementTabFilter, setStatementTabFilter] = useState("all"); // all, pending, paid, refunds
  const [bulkUtrRef, setBulkUtrRef] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");

  // Main table multi-selection for bulk action
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [tableBulkUtr, setTableBulkUtr] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPayables = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPayables({
        type: viewType,
        status: statusFilter,
        search,
      }, page, 15);

      if (data && data.status === "success") {
        setPayables(data.results || []);
        if (data.metrics) setMetrics(data.metrics);
        setTotalPages(data.total_pages || 1);
        setTotalFiltered(data.total || 0);
      }
    } catch (err) {
      console.error("Fetch payables error:", err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewType, statusFilter, search, page]);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  const openProcessModal = (item) => {
    setSelectedPayable(item);
    setFormData({
      payout_status: item.payout_status === "PENDING" ? "PAID" : item.payout_status,
      payout_amount: item.payout_amount || item.fee_amount || 0,
      payout_transaction_ref: item.payout_transaction_ref || "",
      payment_status: item.payment_status === "PENDING_REFUND" ? "REFUNDED" : item.payment_status,
      refund_amount: item.refund_amount || item.fee_amount || 0,
      refund_notes: item.refund_notes || "",
    });
  };

  const openPractitionerStatement = async (nutriId) => {
    if (!nutriId) {
      showToast("Practitioner ID not found", "error");
      return;
    }
    setStatementModalOpen(true);
    setStatementLoading(true);
    setStatementTabFilter("all");
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setBulkUtrRef(`PAYOUT-${todayStr}-${Math.floor(1000 + Math.random() * 9000)}`);
    setBulkNotes("");

    try {
      const data = await getNutritionistPayablesHistory(nutriId);
      if (data && data.status === "success") {
        setStatementData(data);
        // Pre-select all pending payout items
        const pendingIds = (data.records || [])
          .filter(r => (r.payout_status || "").toUpperCase() === "PENDING" || ((r.status || "").toUpperCase() === "CONFIRMED" && (r.payout_status || "").toUpperCase() !== "PAID"))
          .map(r => r.id);
        setSelectedStatementItemIds(pendingIds);
      }
    } catch (err) {
      showToast(err.message || "Failed to load practitioner statement", "error");
    } finally {
      setStatementLoading(false);
    }
  };

  const handleSubmitFinancialUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPayable) return;

    setActionLoading(true);
    try {
      const payload = {};
      if (viewType === "refunds" || selectedPayable.status === "CANCELLED" || selectedPayable.payment_status === "PENDING_REFUND") {
        payload.payment_status = formData.payment_status;
        payload.refund_amount = formData.refund_amount;
        payload.refund_notes = formData.refund_notes;
      } else {
        payload.payout_status = formData.payout_status;
        payload.payout_amount = formData.payout_amount;
        payload.payout_transaction_ref = formData.payout_transaction_ref;
      }

      const res = await updatePayable(selectedPayable.id, payload);
      showToast(res.message || "Financial record updated successfully");
      setSelectedPayable(null);
      fetchPayables();
    } catch (err) {
      showToast(err.message || "Failed to update record", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPayoutInOneGo = async (actionType = "PAYOUT") => {
    if (!selectedStatementItemIds.length) {
      showToast("Please select at least one consultation record to settle", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await bulkPayableAction({
        appointment_ids: selectedStatementItemIds,
        action: actionType,
        status: actionType === "PAYOUT" ? "PAID" : "REFUNDED",
        transaction_ref: bulkUtrRef,
        notes: bulkNotes,
      });

      showToast(res.message || `Processed ${res.updated_count} record(s) in one go!`);

      // Refresh statement data
      if (statementData?.nutritionist?.id) {
        const refreshed = await getNutritionistPayablesHistory(statementData.nutritionist.id);
        setStatementData(refreshed);
        setSelectedStatementItemIds([]);
      }
      fetchPayables();
    } catch (err) {
      showToast(err.message || "Bulk action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTableBulkAction = async (actionType = "PAYOUT") => {
    if (!selectedTableIds.length) {
      showToast("Please select at least one row from the table", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await bulkPayableAction({
        appointment_ids: selectedTableIds,
        action: actionType,
        status: actionType === "PAYOUT" ? "PAID" : "REFUNDED",
        transaction_ref: tableBulkUtr || `BULK-${actionType}-${Date.now()}`,
      });
      showToast(res.message || `Processed ${res.updated_count} record(s) in one go!`);
      setSelectedTableIds([]);
      setTableBulkUtr("");
      fetchPayables();
    } catch (err) {
      showToast(err.message || "Bulk action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleTableSelectAll = () => {
    if (selectedTableIds.length === payables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(payables.map(p => p.id));
    }
  };

  const toggleTableSelectRow = (id) => {
    setSelectedTableIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filtered statement records
  const filteredStatementRecords = (statementData?.records || []).filter(r => {
    if (statementTabFilter === "pending") return (r.payout_status || "").toUpperCase() === "PENDING";
    if (statementTabFilter === "paid") return (r.payout_status || "").toUpperCase() === "PAID";
    if (statementTabFilter === "refunds") return r.refund_amount > 0 || (r.payment_status || "").toUpperCase() === "PENDING_REFUND" || (r.payment_status || "").toUpperCase() === "REFUNDED";
    return true;
  });

  const selectedStatementTotalPayout = (statementData?.records || [])
    .filter(r => selectedStatementItemIds.includes(r.id))
    .reduce((sum, r) => sum + (parseFloat(r.payout_amount) || parseFloat(r.fee_amount) || 0), 0);

  const selectedStatementTotalRefund = (statementData?.records || [])
    .filter(r => selectedStatementItemIds.includes(r.id))
    .reduce((sum, r) => sum + (parseFloat(r.refund_amount) || parseFloat(r.fee_amount) || 0), 0);

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
              Financial Disbursements & Refunds
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {totalFiltered} Records Found
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Payables & Practitioner Payouts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage consultation earnings, platform commission cuts, and disburse multiple practitioner payouts in one go.
          </p>
        </div>

        <button
          onClick={() => fetchPayables(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : "text-slate-500"} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => { setViewType("payouts"); setStatusFilter("PENDING"); setPage(1); }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 duration-200 ${
            viewType === "payouts" && statusFilter === "PENDING"
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-md"
              : "bg-white border-slate-200/80 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Clock size={13} /> Pending Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹{metrics.pending_payouts_total.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {metrics.pending_payouts_count} practitioner consultations pending settlement
          </p>
        </div>

        <div
          onClick={() => { setViewType("payouts"); setStatusFilter("PAID"); setPage(1); }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 duration-200 ${
            viewType === "payouts" && statusFilter === "PAID"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-md"
              : "bg-white border-slate-200/80 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={13} /> Paid Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹{metrics.paid_payouts_total.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {metrics.paid_payouts_count} disbursed payments
          </p>
        </div>

        <div
          onClick={() => { setViewType("refunds"); setStatusFilter("PENDING_REFUND"); setPage(1); }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 duration-200 ${
            viewType === "refunds"
              ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-md"
              : "bg-white border-slate-200/80 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft size={13} /> Pending Refunds
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹{metrics.pending_refunds_total.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-700 font-medium mt-1">
            {metrics.pending_refunds_count} patient cancellations
          </p>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹{(metrics.paid_payouts_total + metrics.refunded_total).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Combined payouts & refunds
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* View Toggle Tabs */}
        <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => { setViewType("all"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewType === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Financials
          </button>
          <button
            onClick={() => { setViewType("payouts"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewType === "payouts" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Nutritionist Payouts
          </button>
          <button
            onClick={() => { setViewType("refunds"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              viewType === "refunds" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Patient Refunds
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by doctor, patient, ID, or UTR reference..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Payout</option>
            <option value="PAID">Paid Payout</option>
            <option value="PENDING_REFUND">Pending Refund</option>
            <option value="REFUNDED">Refund Processed</option>
          </select>
        </div>
      </div>

      {/* Payables Records List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
          <Loader2 size={36} className="animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-semibold text-gray-600">Retrieving financial ledger...</p>
        </div>
      ) : payables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center p-6">
          <CheckCircle2 size={44} className="text-emerald-400 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No pending records found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            All appointments and cancellations matching the filter have been settled.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={payables.length > 0 && selectedTableIds.length === payables.length}
                      onChange={toggleTableSelectAll}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3.5">Appointment</th>
                  <th className="px-5 py-3.5">Doctor / Nutritionist</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Fee & Commission</th>
                  <th className="px-5 py-3.5">Payout Status</th>
                  <th className="px-5 py-3.5">Refund Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payables.map((item) => {
                  const isPaid = (item.payout_status || "").toUpperCase() === "PAID";
                  const isRefunded = (item.payment_status || "").toUpperCase() === "REFUNDED";
                  const isRefundPending = (item.payment_status || "").toUpperCase() === "PENDING_REFUND";
                  const isSelected = selectedTableIds.includes(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-orange-50/20 transition-colors ${isSelected ? "bg-orange-50/30" : ""}`}>
                      <td className="w-10 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTableSelectRow(item.id)}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">Appt #{item.id}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {item.slot_date || "Date scheduled"} · {item.appointment_type}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">{item.nutritionist?.name}</div>
                        <div className="text-[11px] text-gray-400">{item.nutritionist?.email}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">{item.patient?.name}</div>
                        <div className="text-[11px] text-gray-400">{item.patient?.email}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">Rs {item.fee_amount}</div>
                        {item.commission_amount > 0 && (
                          <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                            Cut ({item.commission_rate || 5}%): -Rs {item.commission_amount}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {item.payout_status} (Rs {item.payout_amount})
                        </span>
                        {item.payout_transaction_ref && (
                          <div className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[130px]">
                            Ref: {item.payout_transaction_ref}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isRefundPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={12} /> Refund Due (Rs {item.refund_amount || item.fee_amount})
                          </span>
                        ) : isRefunded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-gray-100 text-gray-700">
                            <Check size={12} /> Refunded (Rs {item.refund_amount})
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium">No Refund Due</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openPractitionerStatement(item.nutritionist?.id || item.nutri_id)}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer inline-flex items-center gap-1 shadow-2xs border border-emerald-200"
                            title="View all consultations, fees, and pay in one go"
                          >
                            <Building2 size={13} />
                            <span>Statement & Pay All</span>
                          </button>
                          <button
                            onClick={() => openProcessModal(item)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                            title="Edit single transaction"
                          >
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Showing {payables.length} of {totalFiltered} financial entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-gray-800 px-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar for Selected Table Rows */}
      {selectedTableIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-[11px] font-black flex items-center justify-center">
              {selectedTableIds.length}
            </span>
            <span className="text-xs font-bold">Selected</span>
          </div>

          <input
            type="text"
            placeholder="Disbursement Ref (UTR / NEFT)..."
            value={tableBulkUtr}
            onChange={(e) => setTableBulkUtr(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400 min-w-[200px]"
          />

          <button
            onClick={() => handleTableBulkAction("PAYOUT")}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Pay Selected in One Go
          </button>

          <button
            onClick={() => handleTableBulkAction("REFUND")}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <ArrowDownLeft size={13} />
            Refund Selected
          </button>

          <button
            onClick={() => setSelectedTableIds([])}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer ml-1"
            title="Deselect all"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* PRACTITIONER STATEMENT & "PAY IN ONE GO" POPUP MODAL */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/80 via-white to-emerald-50/40">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/20 shrink-0">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-gray-900 leading-tight">
                      {statementData?.nutritionist?.name || "Practitioner Ledger & Payout Statement"}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {statementData?.nutritionist?.type || "Practitioner"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {statementData?.nutritionist?.email} · {statementData?.nutritionist?.phone || "No phone"} · All Consultation & Refund Ledger
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStatementModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
                title="Close statement"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {statementLoading ? (
              <div className="flex flex-col items-center justify-center py-28">
                <Loader2 size={36} className="animate-spin text-orange-500 mb-3" />
                <p className="text-sm font-semibold text-gray-600">Loading complete practitioner payment history...</p>
              </div>
            ) : !statementData ? (
              <div className="py-20 text-center text-gray-400 font-semibold">No records found</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Consultations</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{statementData.summary.total_appointments}</p>
                    <span className="text-[10px] text-slate-500">All bookings</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Fees Collected</span>
                    <p className="text-lg font-black text-slate-900 mt-1">₹{statementData.summary.total_fees_collected.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-500">Gross patient payments</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100">
                    <span className="text-[10px] font-bold uppercase text-orange-600 block">Platform Commission</span>
                    <p className="text-lg font-black text-orange-700 mt-1">-₹{statementData.summary.total_commission_cut.toLocaleString()}</p>
                    <span className="text-[10px] text-orange-600">Company cut retained</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 col-span-2 sm:col-span-1 ring-2 ring-emerald-500/20">
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Pending Payout Due</span>
                    <p className="text-xl font-black text-emerald-800 mt-1">₹{statementData.summary.pending_payout_total.toLocaleString()}</p>
                    <span className="text-[10px] font-bold text-emerald-700">{statementData.summary.pending_payout_count} due to be paid</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Already Disbursed</span>
                    <p className="text-lg font-black text-slate-900 mt-1">₹{statementData.summary.paid_payout_total.toLocaleString()}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">{statementData.summary.paid_payout_count} completed</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[10px] font-bold uppercase text-rose-600 block">Patient Refunds</span>
                    <p className="text-lg font-black text-rose-700 mt-1">₹{(statementData.summary.pending_refund_total + statementData.summary.refunded_total).toLocaleString()}</p>
                    <span className="text-[10px] text-rose-600">{statementData.summary.pending_refund_total > 0 ? `₹${statementData.summary.pending_refund_total} due` : "All settled"}</span>
                  </div>
                </div>

                {/* PAY IN ONE GO ACTION PANEL */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-orange-500/10 to-transparent p-5 rounded-3xl border border-emerald-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-900">
                        Disburse Consultation Payouts in One Go
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Selected <strong className="text-slate-900">{selectedStatementItemIds.length}</strong> record(s) totaling{" "}
                      <strong className="text-emerald-700 text-sm">₹{selectedStatementTotalPayout.toLocaleString()}</strong> net payout.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Disbursement Reference / UTR (e.g. NEFT/UPI-10928)..."
                        value={bulkUtrRef}
                        onChange={(e) => setBulkUtrRef(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[260px] shadow-2xs"
                      />
                      <input
                        type="text"
                        placeholder="Internal payout notes (optional)..."
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[200px] shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleBulkPayoutInOneGo("PAYOUT")}
                      disabled={actionLoading || selectedStatementItemIds.length === 0}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                      <span>💸 Pay {selectedStatementItemIds.length} Payout(s) in One Go (₹{selectedStatementTotalPayout.toLocaleString()})</span>
                    </button>

                    {statementData.summary.pending_refund_total > 0 && (
                      <button
                        onClick={() => handleBulkPayoutInOneGo("REFUND")}
                        disabled={actionLoading || selectedStatementItemIds.length === 0}
                        className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowDownLeft size={15} />
                        <span>Refund Selected (₹{selectedStatementTotalRefund.toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs for Statement Records */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      onClick={() => setStatementTabFilter("all")}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        statementTabFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      All Records ({statementData.records.length})
                    </button>
                    <button
                      onClick={() => setStatementTabFilter("pending")}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        statementTabFilter === "pending" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      Pending Payouts ({statementData.summary.pending_payout_count})
                    </button>
                    <button
                      onClick={() => setStatementTabFilter("paid")}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        statementTabFilter === "paid" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      Paid Disbursed ({statementData.summary.paid_payout_count})
                    </button>
                    <button
                      onClick={() => setStatementTabFilter("refunds")}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        statementTabFilter === "refunds" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      Refunds & Cancellations
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allVisibleIds = filteredStatementRecords.map(r => r.id);
                        if (selectedStatementItemIds.length === allVisibleIds.length) {
                          setSelectedStatementItemIds([]);
                        } else {
                          setSelectedStatementItemIds(allVisibleIds);
                        }
                      }}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {selectedStatementItemIds.length === filteredStatementRecords.length ? "Deselect All" : "Select All Visible"}
                    </button>
                    <button
                      onClick={() => {
                        const pendingIds = (statementData.records || [])
                          .filter(r => (r.payout_status || "").toUpperCase() === "PENDING" || ((r.status || "").toUpperCase() === "CONFIRMED" && (r.payout_status || "").toUpperCase() !== "PAID"))
                          .map(r => r.id);
                        setSelectedStatementItemIds(pendingIds);
                      }}
                      className="px-3 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold hover:bg-orange-100 transition cursor-pointer"
                    >
                      Select All Pending Only
                    </button>
                  </div>
                </div>

                {/* Table of All Consultations & Financial Records */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                          <th className="w-10 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={filteredStatementRecords.length > 0 && selectedStatementItemIds.length === filteredStatementRecords.length}
                              onChange={() => {
                                const visibleIds = filteredStatementRecords.map(r => r.id);
                                if (selectedStatementItemIds.length === visibleIds.length) {
                                  setSelectedStatementItemIds([]);
                                } else {
                                  setSelectedStatementItemIds(visibleIds);
                                }
                              }}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3">Appt #</th>
                          <th className="px-4 py-3">Date & Slot</th>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Mode</th>
                          <th className="px-4 py-3">Gross Fee</th>
                          <th className="px-4 py-3">Platform Cut</th>
                          <th className="px-4 py-3">Net Payout</th>
                          <th className="px-4 py-3">Payout Status</th>
                          <th className="px-4 py-3">Refund Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStatementRecords.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-gray-400 font-medium">
                              No consultations match the selected filter.
                            </td>
                          </tr>
                        ) : (
                          filteredStatementRecords.map((r) => {
                            const isPaid = (r.payout_status || "").toUpperCase() === "PAID";
                            const isRefundPending = (r.payment_status || "").toUpperCase() === "PENDING_REFUND";
                            const isRefunded = (r.payment_status || "").toUpperCase() === "REFUNDED";
                            const isSelected = selectedStatementItemIds.includes(r.id);

                            return (
                              <tr
                                key={r.id}
                                onClick={() => {
                                  setSelectedStatementItemIds(prev =>
                                    prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]
                                  );
                                }}
                                className={`hover:bg-orange-50/20 transition-colors cursor-pointer ${
                                  isSelected ? "bg-orange-50/30" : ""
                                }`}
                              >
                                <td className="w-10 px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedStatementItemIds(prev =>
                                        prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]
                                      );
                                    }}
                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                                  />
                                </td>

                                <td className="px-4 py-3 font-bold text-gray-900">
                                  #{r.id}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-800">{r.slot_date || "Upcoming"}</div>
                                  <div className="text-[10px] text-gray-400">{r.slot_start_time || "Flexible"}</div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-800">{r.patient?.name}</div>
                                  <div className="text-[10px] text-gray-400">{r.patient?.email}</div>
                                </td>

                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
                                    {r.appointment_type}
                                  </span>
                                </td>

                                <td className="px-4 py-3 font-bold text-gray-900">
                                  ₹{r.fee_amount}
                                </td>

                                <td className="px-4 py-3 text-orange-600 font-bold">
                                  -₹{r.commission_amount} ({r.commission_rate}%)
                                </td>

                                <td className="px-4 py-3 font-black text-emerald-700 text-xs">
                                  ₹{r.payout_amount}
                                </td>

                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}>
                                    {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                    {r.payout_status}
                                  </span>
                                  {r.payout_transaction_ref && (
                                    <div className="text-[10px] font-mono text-gray-400 truncate max-w-[120px] mt-0.5">
                                      Ref: {r.payout_transaction_ref}
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  {isRefundPending ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                      Due ₹{r.refund_amount || r.fee_amount}
                                    </span>
                                  ) : isRefunded ? (
                                    <span className="text-[10px] font-bold text-gray-500">
                                      Refunded ₹{r.refund_amount}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">None</span>
                                  )}
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
            )}

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {selectedStatementItemIds.length} item(s) selected for settlement
              </span>
              <button
                type="button"
                onClick={() => setStatementModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ITEM EDIT TRANSACTION MODAL */}
      {selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 to-white">
              <div>
                <h3 className="font-black text-xl text-gray-900 leading-tight">
                  Settle Financial Transaction #{selectedPayable.id}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  Update disbursement status, transaction reference, or patient refund
                </p>
              </div>
              <button
                onClick={() => setSelectedPayable(null)}
                className="p-2.5 text-gray-400 hover:text-gray-700 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitFinancialUpdate} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-sm">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Doctor:</span>
                  <p className="font-bold text-gray-800 truncate text-sm mt-0.5">{selectedPayable.nutritionist?.name}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Patient:</span>
                  <p className="font-bold text-gray-800 truncate text-sm mt-0.5">{selectedPayable.patient?.name}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Collected Fee:</span>
                  <p className="font-black text-gray-900 text-base mt-0.5">Rs {selectedPayable.fee_amount}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">Appt Status:</span>
                  <p className="font-bold text-orange-600 text-sm mt-0.5">{selectedPayable.status}</p>
                </div>
              </div>

              {/* Payout to Nutritionist Section */}
              <div className="space-y-4 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-emerald-500" />
                  Nutritionist Payout Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">Payout Status</label>
                    <select
                      value={formData.payout_status}
                      onChange={(e) => setFormData({ ...formData, payout_status: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="PAID">PAID (Disbursed)</option>
                      <option value="PENDING">PENDING</option>
                      <option value="HOLD">ON HOLD</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">Payout Amount (Rs)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.payout_amount}
                      onChange={(e) => setFormData({ ...formData, payout_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">
                    Disbursement Transaction Ref / UTR / Mode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/UTR/2026110892019 or IMPS/Bank-91283"
                    value={formData.payout_transaction_ref}
                    onChange={(e) => setFormData({ ...formData, payout_transaction_ref: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              {/* Patient Refund Section if cancelled or requested */}
              {(selectedPayable.status === "CANCELLED" || selectedPayable.payment_status === "PENDING_REFUND" || selectedPayable.refund_amount > 0) && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs sm:text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <ArrowDownLeft size={16} className="text-rose-500" />
                    Patient Refund Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">Refund Status</label>
                      <select
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
                      >
                        <option value="REFUNDED">REFUNDED</option>
                        <option value="PENDING_REFUND">PENDING_REFUND</option>
                        <option value="NO_REFUND">NO_REFUND</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">Refund Amount (Rs)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.refund_amount}
                        onChange={(e) => setFormData({ ...formData, refund_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide block">Refund Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Appointment cancelled by doctor, full refund initiated"
                      value={formData.refund_notes}
                      onChange={(e) => setFormData({ ...formData, refund_notes: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayable(null)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Financial Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
