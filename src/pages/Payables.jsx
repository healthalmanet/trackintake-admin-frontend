import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee, CreditCard, RefreshCw, Search, Filter,
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowUpRight,
  ArrowDownLeft, Building2, User, Check, X, Eye, FileText,
  ChevronLeft, ChevronRight, Loader2, Sparkles
} from "lucide-react";
import { getPayables, updatePayable } from "../api/payables";

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

  // Modal
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [formData, setFormData] = useState({
    payout_status: "PAID",
    payout_amount: 0,
    payout_transaction_ref: "",
    payment_status: "REFUNDED",
    refund_amount: 0,
    refund_notes: "",
  });
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
              {totalFiltered} Records Pending / Processed
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Payables & Patient Refunds
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage appointment payouts owed to nutritionists and process cancellation refunds for patients
          </p>
        </div>
        <button
          onClick={() => fetchPayables(true)}
          disabled={refreshing || loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
          Refresh
        </button>
      </div>

      {/* Executive Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          onClick={() => { setViewType("payouts"); setStatusFilter("PENDING"); setPage(1); }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 duration-200 ${
            viewType === "payouts" && statusFilter === "PENDING"
              ? "bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/20 shadow-md"
              : "bg-white border-slate-200/80 hover:border-orange-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight size={13} /> Pending Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100/70 text-orange-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹{metrics.pending_payouts_total.toLocaleString()}
          </p>
          <p className="text-[11px] text-orange-700 font-medium mt-1">
            {metrics.pending_payouts_count} sessions owed to nutritionists
          </p>
        </div>

        <div
          onClick={() => { setViewType("payouts"); setStatusFilter("PAID"); setPage(1); }}
          className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 duration-200 ${
            statusFilter === "PAID"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-md"
              : "bg-white border-slate-200/80 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={13} /> Completed Payouts
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
                  <th className="px-5 py-3.5">Appointment</th>
                  <th className="px-5 py-3.5">Doctor / Nutritionist</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Fee Amount</th>
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

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
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

                      <td className="px-5 py-4 font-bold text-gray-900">
                        Rs {item.fee_amount}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
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
                        <button
                          onClick={() => openProcessModal(item)}
                          className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                        >
                          Manage <ArrowUpRight size={13} />
                        </button>
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

      {/* Process Payout / Refund Modal */}
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

