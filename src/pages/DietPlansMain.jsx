import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, MoreVertical, Trash2, Copy, X, Apple } from 'lucide-react';
import { getDietPlans, getNutritionists, getUsers } from '../api/dietPlans';

export default function DietPlansMain() {
  const [plans, setPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nutritionists, setNutritionists] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nutritionistFilter, setNutritionistFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  
  // Modals
  const [viewDrawer, setViewDrawer] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [currentPage]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPlans(),
        fetchAllPlansForStats(),
        fetchNutritionists(),
        fetchUsers()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlansForStats = async () => {
    try {
      // Fetch all plans with a large page size to get stats
      const data = await getDietPlans({}, 1, 1000);
      if (data.results) {
        setAllPlans(data.results);
      } else {
        const plansArray = Array.isArray(data) ? data : [];
        setAllPlans(plansArray);
      }
    } catch (error) {
      console.error('Error fetching all plans for stats:', error);
      setAllPlans([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await getDietPlans({}, currentPage, itemsPerPage);
      // Handle paginated response
      if (data.results) {
        setPlans(data.results);
        setTotalCount(data.count);
        const total = Math.ceil(data.count / itemsPerPage);
        setTotalPages(total);
      } else {
        const plansArray = Array.isArray(data) ? data : [];
        setPlans(plansArray);
        setTotalCount(plansArray.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  };

  const fetchNutritionists = async () => {
    try {
      const data = await getNutritionists();
      setNutritionists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching nutritionists:', error);
      setNutritionists([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      const usersArray = Array.isArray(data) ? data : (data?.results ? data.results : []);
      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Create user map for O(1) lookups
  const userMap = users.reduce((map, user) => {
    map[user.id] = user.full_name || user.username || `User ${user.id}`;
    return map;
  }, {});

  const getUserName = (userId) => {
    return userMap[userId] || `User ${userId}`;
  };

  // Create nutritionist map
  const nutritionistMap = nutritionists.reduce((map, nut) => {
    map[nut.id] = nut.full_name || `Nutritionist ${nut.id}`;
    return map;
  }, {});

  const getNutritionistName = (nutritionistId) => {
    return nutritionistMap[nutritionistId] || 'Unassigned';
  };

  // Filter logic - now just for display since backend handles pagination
  const filteredPlans = plans
    .filter(plan => {
      const matchesSearch = !searchTerm || 
        (plan.user_id?.toString().includes(searchTerm)) ||
        (plan.for_week_starting?.includes(searchTerm));
      
      const planStatus = plan.status ? plan.status.toLowerCase() : '';
      const filterStatus = statusFilter ? statusFilter.toLowerCase() : 'all';
      const matchesStatus = filterStatus === 'all' || planStatus === filterStatus;
      
      const matchesNutritionist = nutritionistFilter === 'All' || 
        plan.reviewed_by_id?.toString() === nutritionistFilter;
      
      const isArchived = planStatus === 'archived';
      const matchesArchiveFilter = showArchived ? isArchived : !isArchived;
      
      return matchesSearch && matchesStatus && matchesNutritionist && matchesArchiveFilter;
    });

  // Use paginated plans directly from backend
  const paginatedPlans = filteredPlans;

  // Calculate stats from all plans
  const totalPlans = totalCount;
  const draftPlans = allPlans.filter(p => p.status?.toLowerCase() === 'draft').length;
  const activePlans = allPlans.filter(p => p.status?.toLowerCase() === 'active').length;
  const approvedPlans = allPlans.filter(p => p.status?.toLowerCase() === 'approved').length;
  const pendingPlans = allPlans.filter(p => p.status?.toLowerCase() === 'pending').length;
  const failedPlans = allPlans.filter(p => p.status?.toLowerCase() === 'failed').length;
  const rejectedPlans = allPlans.filter(p => p.status?.toLowerCase() === 'rejected').length;

  const getStatusColor = (status) => {
    const colors = {
      'approved': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'pending': 'bg-amber-50 text-amber-700 border border-amber-200',
      'failed': 'bg-red-50 text-red-700 border border-red-200',
      'rejected': 'bg-orange-50 text-orange-700 border border-orange-200',
      'archived': 'bg-gray-50 text-gray-700 border border-gray-200',
    };
    return colors[status?.toLowerCase()] || colors['pending'];
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diet plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Diet Plans</h1>
          <div className="flex items-center gap-2 mt-1.5 opacity-80">
            <Apple size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">Manage weekly diet plans assigned to users</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Plans" value={totalPlans.toString()} change="+12% from last month" color="orange" />
        <StatCard label="Draft" value={draftPlans.toString()} change="Not yet submitted" color="amber" />
        <StatCard label="Active" value={activePlans.toString()} change="Currently active" color="emerald" />
        <StatCard label="Pending" value={pendingPlans.toString()} change="Awaiting approval" color="amber" />
        <StatCard label="Rejected" value={rejectedPlans.toString()} change="Need revision" color="red" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Filter Plans</h3>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setNutritionistFilter('All');
              setDateFilter('');
              setShowArchived(false);
              setCurrentPage(1);
            }}
            className="text-[#F97316] text-sm font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
          </div>

          <select
            value={nutritionistFilter}
            onChange={(e) => setNutritionistFilter(e.target.value)}
            className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition cursor-pointer"
          >
            <option>All Nutritionists</option>
            {nutritionists.map(n => (
              <option key={n.id} value={n.id}>{n.full_name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          />

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              showArchived
                ? 'bg-[#F97316] text-white'
                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showArchived ? 'Archived' : 'Active'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["User", "Week", "Nutritionist", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No plans found.</td></tr>
              ) : (
                paginatedPlans.map((plan, i) => (
                  <tr key={plan.id} className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {getUserName(plan.user_id).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{getUserName(plan.user_id)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <div className="font-medium">{plan.for_week_starting}</div>
                      <div className="text-xs text-gray-500">to {new Date(new Date(plan.for_week_starting).getTime() + 6*24*60*60*1000).toISOString().split('T')[0]}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-medium">
                      {getNutritionistName(plan.reviewed_by_id)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-medium tracking-wide">
                      {plan.created_at ? new Date(plan.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button title="View Details" onClick={() => setViewDrawer(plan)} className="p-2 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition cursor-pointer">
                          <Eye size={16} />
                        </button>
                        {plan.status?.toLowerCase() === 'rejected' ? (
                          <>
                            <button title="Edit & Resubmit" onClick={() => {
                              window.dispatchEvent(new CustomEvent('app-nav', { detail: { page: 'createDiet', planId: plan.id } }));
                            }} className="p-2 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-500 transition cursor-pointer">
                              <Edit2 size={16} />
                            </button>
                            <button title="Duplicate Plan" onClick={() => {
                              window.dispatchEvent(new CustomEvent('app-nav', { detail: { page: 'createDiet', duplicatePlanId: plan.id } }));
                            }} className="p-2 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-500 transition cursor-pointer">
                              <Copy size={16} />
                            </button>
                          </>
                        ) : (
                          <button title="Edit Plan" onClick={() => {
                            window.dispatchEvent(new CustomEvent('app-nav', { detail: { page: 'createDiet', planId: plan.id } }));
                          }} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button title="More Options" className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-pointer">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Showing {plans.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, plans.length)} of {plans.length} plans</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-sm font-semibold">
              Prev
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-sm font-semibold">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Drawer */}
      {viewDrawer && (
        <ViewPlanDrawer plan={viewDrawer} onClose={() => setViewDrawer(null)} users={users} nutritionists={nutritionists} />
      )}
    </div>
  );
}

function StatCard({ label, value, change, color }) {
  const colorMap = {
    orange: { border: 'border-t-[3px] border-orange-400', text: 'text-orange-500' },
    emerald: { border: 'border-t-[3px] border-emerald-400', text: 'text-emerald-600' },
    amber: { border: 'border-t-[3px] border-amber-400', text: 'text-amber-600' },
    red: { border: 'border-t-[3px] border-red-400', text: 'text-red-600' },
  };

  return (
    <div className={`bg-white rounded-2xl ${colorMap[color].border} shadow-sm hover:shadow-md p-5 transition-all duration-500 ease-out transform hover:-translate-y-1.5`}>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-extrabold tracking-tight mt-2 ${colorMap[color].text}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{change}</p>
    </div>
  );
}

function ViewPlanDrawer({ plan, onClose, users, nutritionists }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [activeDay, setActiveDay] = useState(0);

  const userMap = users.reduce((map, user) => {
    map[user.id] = user.full_name || user.username || `User ${user.id}`;
    return map;
  }, {});

  const nutritionistMap = nutritionists.reduce((map, nut) => {
    map[nut.id] = nut.full_name || `Nutritionist ${nut.id}`;
    return map;
  }, {});

  const getUserName = (userId) => {
    return userMap[userId] || `User ${userId}`;
  };

  const getNutritionistName = (nutritionistId) => {
    return nutritionistMap[nutritionistId] || 'Unassigned';
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Weekly Plan — {getUserName(plan.user_id)}</h2>
            <p className="text-sm font-medium text-gray-400 mt-0.5">{plan.for_week_starting} to {new Date(new Date(plan.for_week_starting).getTime() + 6*24*60*60*1000).toISOString().split('T')[0]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer shadow-sm">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ {plan.status}
            </span>
          </div>

          {/* Patient Info */}
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3 border-b-2 border-orange-100 pb-2 inline-block">Patient Info</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Name</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{getUserName(plan.user_id)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{plan.status}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Week</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{plan.for_week_starting}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Assigned To</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{getNutritionistName(plan.reviewed_by_id)}</p>
              </div>
            </div>
          </div>

          {/* Meals Info */}
          {plan.meals && (
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 border-b-2 border-orange-100 pb-2 inline-block">Meal Plan</h3>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <p className="text-sm text-gray-700">
                  {plan.meals && typeof plan.meals === 'object' ? (
                    <span>Plan contains {Object.keys(plan.meals).length} days of meals</span>
                  ) : (
                    <span>Meal data available</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Nutritionist Comment */}
          {plan.nutritionist_comment && (
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 border-b-2 border-orange-100 pb-2 inline-block">Nutritionist Comment</h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-gray-700">{plan.nutritionist_comment}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('app-nav', { detail: { page: 'createDiet', planId: plan.id } }));
              }}
              className="flex-1 px-4 py-2 border border-[#F97316] text-[#F97316] rounded-lg font-semibold hover:bg-orange-50 transition-colors">
              Edit Plan
            </button>
            <button className="flex-1 px-4 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              Send to User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
