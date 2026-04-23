import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/dashboard`;

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${url}`);
  return res.json();
};

export const getDashboardStats = async ({ range, date } = {}) => {
  //  query params based on range type
  let params = "";
  if (range === "day" && date) {
    params = `?date=${date}`;
  } else if (range === "month" && date) {
    const [year, month] = date.split("-");
    params = `?year=${year}&month=${month}`;
  } else if (range === "year" && date) {
    params = `?year=${date}`;
  } else if (range === "week" && date) {
    params = `?date=${date}`;
  }

  const [
    totalUsersRes,
    activeUsersRes,
    totalRevenueRes,
    pendingRes,
    growthRes,
    planDistRes,
    revenueByPlanRes,
    recentRes,
  ] = await Promise.all([
    fetchJSON(`${BASE}/total-users/${params}`),
    fetchJSON(`${BASE}/active-users/${params}`),
    fetchJSON(`${BASE}/total-revenue/${params}`),
    fetchJSON(`${BASE}/pending-appointments/${params}`),
    fetchJSON(`${BASE}/user-growth/${params}`),
    fetchJSON(`${BASE}/plan-distribution/${params}`),
    fetchJSON(`${BASE}/revenue-by-plan/${params}`),
    fetchJSON(`${BASE}/recent-activity/${params}`),
  ]);

  return {
    totalUsers: totalUsersRes.totalUsers,
    activeUsers: activeUsersRes.activeUsers,
    totalRevenue: totalRevenueRes.totalRevenue,
    pendingAppts: pendingRes.pendingAppointments,
    userGrowth: growthRes.userGrowth ?? [],
    planDistribution: planDistRes.planDistribution ?? [],
    revenueByPlan: revenueByPlanRes.revenueByPlan ?? [],
    recentActivity: recentRes.recentSignups ?? [],
    revenueTrend: [],
    mealCats: [],
  };
};
