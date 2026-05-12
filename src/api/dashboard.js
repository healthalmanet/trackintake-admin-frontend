import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/dashboard`;

const fetchJSON = async (url) => {
  try {
    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API Error ${res.status}: ${url}`);
      throw new Error(`Failed: ${url} (${res.status})`);
    }
    const data = await res.json();
    console.log(`Success: ${url}`, data);
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
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

  console.log(`getDashboardStats called with range=${range}, date=${date}, params=${params}`);

  try {
    const [
      totalUsersRes,
      activeUsersRes,
      totalRevenueRes,
      pendingRes,
      growthRes,
      planDistRes,
      revenueByPlanRes,
      recentRes,
    ] = await Promise.allSettled([
      fetchJSON(`${BASE}/total-users${params}`),
      fetchJSON(`${BASE}/active-users${params}`),
      fetchJSON(`${BASE}/total-revenue${params}`),
      fetchJSON(`${BASE}/pending-appointments${params}`),
      fetchJSON(`${BASE}/user-growth${params}`),
      fetchJSON(`${BASE}/plan-distribution${params}`),
      fetchJSON(`${BASE}/revenue-by-plan${params}`),
      fetchJSON(`${BASE}/recent-activity${params}`),
    ]);

    // Handle settled promises
    const getValue = (settled) => {
      if (settled.status === 'fulfilled') return settled.value;
      console.error('API call failed:', settled.reason);
      return {};
    };

    const result = {
      totalUsers: getValue(totalUsersRes).totalUsers ?? 0,
      activeUsers: getValue(activeUsersRes).activeUsers ?? 0,
      totalRevenue: getValue(totalRevenueRes).totalRevenue ?? 0,
      pendingAppts: getValue(pendingRes).pendingAppointments ?? 0,
      userGrowth: getValue(growthRes).userGrowth ?? [],
      planDistribution: getValue(planDistRes).planDistribution ?? [],
      revenueByPlan: getValue(revenueByPlanRes).revenueByPlan ?? [],
      recentActivity: getValue(recentRes).recentSignups ?? [],
      mealCats: [],
    };
    
    console.log('getDashboardStats result:', result);
    return result;
  } catch (error) {
    console.error('getDashboardStats error:', error);
    throw error;
  }
};
