import { useState, useEffect, useRef } from 'react';
import { Search, Eye, X, Apple } from 'lucide-react';
import { getDietPlans, getNutritionists, getUsers, getAssignedNutritionist, getDietStats } from '../api/dietPlans';

export default function DietPlansMain() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nutritionists, setNutritionists] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nutritionistFilter, setNutritionistFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  
  // Drawer
  const [viewDrawer, setViewDrawer] = useState(null);
  const [assignedNutritionist, setAssignedNutritionist] = useState(null);
  const [assignedNutritionistMap, setAssignedNutritionistMap] = useState({});
  
  // Stats
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, failed: 0, rejected: 0 });
  
  // Debounce ref
  const searchTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  // Fetch when filters change
  useEffect(() => {
    fetchPlans();
  }, [currentPage, statusFilter, nutritionistFilter, debouncedSearch]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchNutritionists(),
        fetchUsers(),
        fetchPlans(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const filters = {};
      if (statusFilter && statusFilter !== 'All') filters.status = statusFilter.toLowerCase();
      if (nutritionistFilter) filters.nutritionist_id = nutritionistFilter;
      if (debouncedSearch) filters.search = debouncedSearch;

      const data = await getDietPlans(filters, currentPage, itemsPerPage);
      
      if (data.results) {
        setPlans(data.results);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / itemsPerPage));

        // Fetch assigned nutritionists
        const nutMap = {};
        for (const plan of data.results) {
          try {
            const assigned = await getAssignedNutritionist(plan.user_id);
            if (assigned) nutMap[plan.user_id] = assigned.full_name;
          } catch (error) {
            console.error(`Error fetching nutritionist for user ${plan.user_id}:`, error);
          }
        }
        setAssignedNutritionistMap(nutMap);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getDietStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, approved: 0, pending: 0, failed: 0, rejected: 0 });
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

  // Helpers
  const userMap = users.reduce((map, user) => {
    map[user.id] = user.full_name || user.username || `User ${user.id}`;
    return map;
  }, {});

  const nutritionistMap = nutritionists.reduce((map, nut) => {
    map[nut.id] = nut.full_name || `Nutritionist ${nut.id}`;
    return map;
  }, {});

  const getUserName = (userId) => {
    // First check if the plan object has user_name from API
    // This is the primary source of truth from backend
    const plan = plans.find(p => p.user_id === userId);
    if (plan && plan.user_name) {
      return plan.user_name;
    }
    
    // Fallback to userMap if available
    const name = userMap[userId];
    if (name) return name;
    
    // Final fallback
    return `User ${userId}`;
  };
  
  const getNutritionistName = (nutritionistId) => {
    if (!nutritionistId) return 'Unassigned';
    return nutritionistMap[nutritionistId] || `Nutritionist ${nutritionistId}`;
  };

  // Stats from API
  const totalPlans = stats.total;
  const approvedPlans = stats.approved;
  const pendingPlans = stats.pending;
  const failedPlans = stats.failed;
  const rejectedPlans = stats.rejected;

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
            <span className="text-sm text-gray-600 font-medium">View weekly diet plans created by nutritionists for users</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Plans" value={totalPlans.toString()} change="" color="orange" />
        <StatCard label="Approved" value={approvedPlans.toString()} change="Successfully approved" color="emerald" />
        <StatCard label="Pending" value={pendingPlans.toString()} change="Awaiting approval" color="amber" />
        <StatCard label="Failed" value={failedPlans.toString()} change="Processing failed" color="red" />
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
              placeholder="Search by user name or nutritionist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
          </div>

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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["Patient", "Week", "Nutritionist", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No plans found.</td></tr>
              ) : (
                plans.map((plan, i) => (
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
                      {assignedNutritionistMap[plan.user_id] || (plan.reviewed_by_id ? getNutritionistName(plan.reviewed_by_id) : 'Unassigned')}
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
                      <button 
                        title="View Details" 
                        onClick={async () => {
                          setViewDrawer(plan);
                          const assigned = await getAssignedNutritionist(plan.user_id);
                          setAssignedNutritionist(assigned);
                        }} 
                        className="p-2 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Showing {plans.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} plans</span>
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
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={() => setViewDrawer(null)} />
          
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Diet Plan Details</h2>
                <p className="text-sm text-gray-600 mt-1">Complete meal plan for {getUserName(viewDrawer.user_id)}</p>
              </div>
              <button onClick={() => setViewDrawer(null)} className="p-2 rounded-lg hover:bg-white transition-colors">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-orange-200 pb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Patient Name</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">{getUserName(viewDrawer.user_id)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mt-2 ${getStatusColor(viewDrawer.status)}`}>
                      {viewDrawer.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Week Starting</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">{viewDrawer.for_week_starting}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Week Ending</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">{new Date(new Date(viewDrawer.for_week_starting).getTime() + 6*24*60*60*1000).toISOString().split('T')[0]}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 col-span-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assigned Nutritionist</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      {assignedNutritionist?.full_name || getNutritionistName(viewDrawer.reviewed_by_id) || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>

              {viewDrawer.meals && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-orange-200 pb-2">Complete Meal Plan</h3>
                  <div className="space-y-4">
                    {Object.entries(viewDrawer.meals).map(([day, meals]) => {
                      if (day === 'nutrition_summary' || day === 'nutrition_table') return null;
                      
                      return (
                        <div key={day} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <h4 className="font-bold text-gray-900 mb-3 text-base">{day}</h4>
                          <div className="space-y-3">
                            {Object.entries(meals).map(([mealType, meal]) => {
                              if (mealType === 'nutrition_summary' || mealType === 'nutrition_table') return null;
                              return meal ? (
                                <div key={mealType} className="bg-white rounded-lg p-4 border border-orange-100">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <p className="font-bold text-gray-900 text-base">{mealType}</p>
                                      <p className="text-sm text-gray-700 mt-1">{meal.food_name}</p>
                                      <p className="text-xs text-gray-600 mt-1">{meal.quantity}</p>
                                    </div>
                                    <p className="text-base font-bold text-orange-600 whitespace-nowrap ml-4">{meal.Calories} kcal</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Protein</p>
                                      <p className="text-lg font-bold text-red-600 mt-1">{meal.Protein_g}g</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Carbs</p>
                                      <p className="text-lg font-bold text-blue-600 mt-1">{meal.Carbs_g}g</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fat</p>
                                      <p className="text-lg font-bold text-yellow-600 mt-1">{meal.Fats_g}g</p>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewDrawer.nutritionist_comment && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-200 pb-2">Nutritionist Comment</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{viewDrawer.nutritionist_comment}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setViewDrawer(null)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
