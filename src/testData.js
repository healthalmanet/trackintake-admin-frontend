// TEST DATA FILE — NOT connected to database

export const TEST_USERS = [
  // January 2026
  { id: 101, full_name: "Aarav Sharma", email: "aarav.sharma@gmail.com", plan: "Hero", role: "user", is_active: true, city: "Mumbai", date_joined: "2026-01-03T08:30:00Z" },
  { id: 102, full_name: "Priya Mehta", email: "priya.mehta@gmail.com", plan: "Basic", role: "user", is_active: true, city: "Delhi", date_joined: "2026-01-10T10:15:00Z" },
  { id: 103, full_name: "Rohan Verma", email: "rohan.verma@yahoo.com", plan: "Silver", role: "nutritionist", is_active: false, city: "Pune", date_joined: "2026-01-18T07:45:00Z" },
  { id: 104, full_name: "Sneha Patil", email: "sneha.patil@outlook.com", plan: "Free", role: "user", is_active: false, city: "Bangalore", date_joined: "2026-01-25T12:00:00Z" },
  { id: 105, full_name: "Karan Joshi", email: "karan.joshi@gmail.com", plan: "Hero", role: "user", is_active: true, city: "Mumbai", date_joined: "2026-01-29T09:20:00Z" },
  // February 2026
  { id: 106, full_name: "Ananya Singh", email: "ananya.singh@gmail.com", plan: "Basic", role: "user", is_active: true, city: "Hyderabad", date_joined: "2026-02-04T14:30:00Z" },
  { id: 107, full_name: "Vikram Nair", email: "vikram.nair@gmail.com", plan: "Silver", role: "user", is_active: true, city: "Chennai", date_joined: "2026-02-11T11:00:00Z" },
  { id: 108, full_name: "Divya Rao", email: "divya.rao@gmail.com", plan: "Free", role: "nutritionist", is_active: false, city: "Kolkata", date_joined: "2026-02-17T08:00:00Z" },
  { id: 109, full_name: "Mehul Shah", email: "mehul.shah@gmail.com", plan: "Hero", role: "user", is_active: true, city: "Ahmedabad", date_joined: "2026-02-22T10:00:00Z" },
  { id: 110, full_name: "Pooja Iyer", email: "pooja.iyer@gmail.com", plan: "Basic", role: "user", is_active: false, city: "Bangalore", date_joined: "2026-02-27T09:00:00Z" },
  // March 2026
  { id: 111, full_name: "Arjun Kapoor", email: "arjun.kapoor@gmail.com", plan: "Silver", role: "user", is_active: true, city: "Delhi", date_joined: "2026-03-03T08:00:00Z" },
  { id: 112, full_name: "Neha Gupta", email: "neha.gupta@gmail.com", plan: "Hero", role: "user", is_active: true, city: "Mumbai", date_joined: "2026-03-08T11:30:00Z" },
  { id: 113, full_name: "Siddharth Rao", email: "siddharth.rao@gmail.com", plan: "Free", role: "user", is_active: false, city: "Pune", date_joined: "2026-03-14T07:00:00Z" },
  { id: 114, full_name: "Kavya Reddy", email: "kavya.reddy@gmail.com", plan: "Basic", role: "nutritionist", is_active: true, city: "Hyderabad", date_joined: "2026-03-19T13:00:00Z" },
  { id: 115, full_name: "Rahul Desai", email: "rahul.desai@gmail.com", plan: "Hero", role: "user", is_active: true, city: "Surat", date_joined: "2026-03-25T10:45:00Z" },
  // April 2026
  { id: 116, full_name: "Ishaan Malhotra", email: "ishaan.malhotra@gmail.com", plan: "Silver", role: "user", is_active: true, city: "Jaipur", date_joined: "2026-04-01T09:00:00Z" },
  { id: 117, full_name: "Tanya Bose", email: "tanya.bose@gmail.com", plan: "Basic", role: "user", is_active: true, city: "Kolkata", date_joined: "2026-04-02T10:30:00Z" },
  { id: 118, full_name: "Nikhil Pandey", email: "nikhil.pandey@gmail.com", plan: "Hero", role: "user", is_active: false, city: "Lucknow", date_joined: "2026-04-04T08:15:00Z" },
  { id: 119, full_name: "Simran Kaur", email: "simran.kaur@gmail.com", plan: "Free", role: "nutritionist", is_active: true, city: "Chandigarh", date_joined: "2026-04-05T11:00:00Z" },
  { id: 120, full_name: "Yash Trivedi", email: "yash.trivedi@gmail.com", plan: "Silver", role: "user", is_active: true, city: "Ahmedabad", date_joined: "2026-04-07T09:30:00Z" },
];

export const TEST_PAYMENTS = {
  total: 16,
  page: 1,
  page_size: 10,
  total_pages: 2,
  results: [
    { user_name: "Aarav Sharma", email: "aarav.sharma@gmail.com", plan_name: "Hero", payment_id: "PAY-001", payment_status: "success", amount: 999, start_date: "2026-01-03", end_date: "2026-02-03" },
    { user_name: "Priya Mehta", email: "priya.mehta@gmail.com", plan_name: "Basic", payment_id: "PAY-002", payment_status: "success", amount: 499, start_date: "2026-01-10", end_date: "2026-02-10" },
    { user_name: "Rohan Verma", email: "rohan.verma@yahoo.com", plan_name: "Silver", payment_id: "PAY-003", payment_status: "failed", amount: 799, start_date: "2026-01-18", end_date: "2026-02-18" },
    { user_name: "Karan Joshi", email: "karan.joshi@gmail.com", plan_name: "Hero", payment_id: "PAY-004", payment_status: "success", amount: 999, start_date: "2026-01-29", end_date: "2026-02-28" },
    { user_name: "Ananya Singh", email: "ananya.singh@gmail.com", plan_name: "Basic", payment_id: "PAY-005", payment_status: "success", amount: 499, start_date: "2026-02-04", end_date: "2026-03-04" },
    { user_name: "Vikram Nair", email: "vikram.nair@gmail.com", plan_name: "Silver", payment_id: "PAY-006", payment_status: "pending", amount: 799, start_date: "2026-02-11", end_date: "2026-03-11" },
    { user_name: "Mehul Shah", email: "mehul.shah@gmail.com", plan_name: "Hero", payment_id: "PAY-007", payment_status: "success", amount: 999, start_date: "2026-02-22", end_date: "2026-03-22" },
    { user_name: "Arjun Kapoor", email: "arjun.kapoor@gmail.com", plan_name: "Silver", payment_id: "PAY-008", payment_status: "success", amount: 799, start_date: "2026-03-03", end_date: "2026-04-03" },
    { user_name: "Neha Gupta", email: "neha.gupta@gmail.com", plan_name: "Hero", payment_id: "PAY-009", payment_status: "success", amount: 999, start_date: "2026-03-08", end_date: "2026-04-08" },
    { user_name: "Kavya Reddy", email: "kavya.reddy@gmail.com", plan_name: "Basic", payment_id: "PAY-010", payment_status: "failed", amount: 499, start_date: "2026-03-19", end_date: "2026-04-19" },
    { user_name: "Rahul Desai", email: "rahul.desai@gmail.com", plan_name: "Hero", payment_id: "PAY-011", payment_status: "success", amount: 999, start_date: "2026-03-25", end_date: "2026-04-25" },
    { user_name: "Ishaan Malhotra", email: "ishaan.malhotra@gmail.com", plan_name: "Silver", payment_id: "PAY-012", payment_status: "success", amount: 799, start_date: "2026-04-01", end_date: "2026-05-01" },
    { user_name: "Tanya Bose", email: "tanya.bose@gmail.com", plan_name: "Basic", payment_id: "PAY-013", payment_status: "pending", amount: 499, start_date: "2026-04-02", end_date: "2026-05-02" },
    { user_name: "Nikhil Pandey", email: "nikhil.pandey@gmail.com", plan_name: "Hero", payment_id: "PAY-014", payment_status: "failed", amount: 999, start_date: "2026-04-04", end_date: "2026-05-04" },
    { user_name: "Yash Trivedi", email: "yash.trivedi@gmail.com", plan_name: "Silver", payment_id: "PAY-015", payment_status: "success", amount: 799, start_date: "2026-04-07", end_date: "2026-05-07" },
    { user_name: "Pooja Iyer", email: "pooja.iyer@gmail.com", plan_name: "Basic", payment_id: "PAY-016", payment_status: "success", amount: 499, start_date: "2026-02-27", end_date: "2026-03-27" },
  ],
};

export const TEST_PLANS = [
  { id: 1, name: "Basic", price: 499, duration_days: 30, is_active: true, appointment_allowed: false, ai_diet_allowed: true, inhouse_consults: 1, expert_consults: 0 },
  { id: 2, name: "Hero", price: 999, duration_days: 30, is_active: true, appointment_allowed: true, ai_diet_allowed: true, inhouse_consults: 3, expert_consults: 1 },
  { id: 3, name: "Silver", price: 799, duration_days: 30, is_active: true, appointment_allowed: true, ai_diet_allowed: true, inhouse_consults: 2, expert_consults: 0 },
  { id: 4, name: "Free", price: 0, duration_days: 30, is_active: false, appointment_allowed: false, ai_diet_allowed: false, inhouse_consults: 0, expert_consults: 0 },
];

// Dashboard data filtered by range
export const getDashboardTestData = (range, date) => {
  const users = TEST_USERS.filter((u) => {
    if (!date) return true;
    if (range === "day") return u.date_joined.startsWith(date);
    if (range === "month") return u.date_joined.startsWith(date);
    if (range === "year") return u.date_joined.startsWith(date);
    return true;
  });

  const planCounts = {};
  users.forEach((u) => { planCounts[u.plan] = (planCounts[u.plan] || 0) + 1; });

  const growthMap = {};
  users.forEach((u) => {
    const d = u.date_joined.split("T")[0];
    growthMap[d] = (growthMap[d] || 0) + 1;
  });
  const userGrowth = Object.entries(growthMap).sort().map(([d, count]) => ({ date: d, users: count }));

  const paidUsers = users.filter((u) => u.plan !== "Free" && u.is_active);
  const planRevenue = { Basic: 499, Hero: 999, Silver: 799 };
  const totalRevenue = paidUsers.reduce((sum, u) => sum + (planRevenue[u.plan] || 0), 0);

  // Build revenue trend from payments filtered by same range
  const revTrendMap = {};
  TEST_PAYMENTS.results.forEach((p) => {
    if (!date) { revTrendMap[p.start_date] = (revTrendMap[p.start_date] || 0) + (p.payment_status === "success" ? p.amount : 0); return; }
    if (range === "month" && p.start_date.startsWith(date)) revTrendMap[p.start_date] = (revTrendMap[p.start_date] || 0) + (p.payment_status === "success" ? p.amount : 0);
    else if (range === "year" && p.start_date.startsWith(date)) revTrendMap[p.start_date] = (revTrendMap[p.start_date] || 0) + (p.payment_status === "success" ? p.amount : 0);
    else if (range === "day" && p.start_date === date) revTrendMap[p.start_date] = (revTrendMap[p.start_date] || 0) + (p.payment_status === "success" ? p.amount : 0);
  });
  const revenueTrend = Object.entries(revTrendMap).sort().map(([d, revenue]) => ({ date: d, month: d, revenue }));

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.is_active).length,
    totalRevenue,
    pendingAppts: Math.max(1, Math.floor(users.length * 0.3)),
    userGrowth,
    planDistribution: Object.entries(planCounts).map(([plan, count]) => ({ plan, users: count })),
    revenueByPlan: Object.entries(planCounts)
      .filter(([plan]) => plan !== "Free")
      .map(([plan, count]) => ({ plan_id: plan, total_revenue: count * (planRevenue[plan] || 0) })),
    recentActivity: [...users].reverse().slice(0, 5).map((u) => ({ ...u, activity: "User signed up" })),
    revenueTrend,
    mealCats: [],
  };
};

// Payments data filtered by range, status, search
export const getPaymentsTestData = (range, date, statusFilter, search) => {
  const results = TEST_PAYMENTS.results.filter((p) => {
    const matchDate = (() => {
      if (!date) return true;
      if (range === "date") return p.start_date === date;
      if (range === "month") return p.start_date.startsWith(date);
      if (range === "year") return p.start_date.startsWith(date);
      return true;
    })();
    const matchStatus = !statusFilter || statusFilter === "all" || p.payment_status === statusFilter;
    const matchSearch = !search ||
      p.user_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchStatus && matchSearch;
  });

  const success = results.filter((p) => p.payment_status === "success");
  const failed = results.filter((p) => p.payment_status === "failed");
  const totalRevenue = success.reduce((sum, p) => sum + p.amount, 0);

  const planRevMap = {};
  success.forEach((p) => { planRevMap[p.plan_name] = (planRevMap[p.plan_name] || 0) + p.amount; });
  const revenuePerPlan = Object.entries(planRevMap).map(([plan_name, revenue], i) => ({ plan_id: i + 1, plan_name, revenue }));

  return {
    payments: { total: results.length, page: 1, page_size: 10, total_pages: Math.ceil(results.length / 10) || 1, results },
    analytics: { totalRevenue, totalPayments: results.length, successPayments: success.length, failedPayments: failed.length, revenuePerPlan },
  };
};
