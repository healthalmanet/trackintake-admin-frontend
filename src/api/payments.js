const USAGE_BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/subscription/usage`;
const ANALYTICS_BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/subscription/payments/analytics`;

export const getPayments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${USAGE_BASE}/?${query}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
};

export const getPaymentAnalytics = async ({ filter = "month", date } = {}) => {
  let query = `?filter=${filter}`;
  if (filter && date) {
    if (filter === "date" || filter === "day") query += `&date=${date}`;
    else if (filter === "month") {
      const parts = date.split("-");
      query += `&year=${parts[0]}&month=${parts[1]}`;
    }
    else if (filter === "year") query += `&year=${date}`;
  }
  const res = await fetch(`${ANALYTICS_BASE}/${query}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
};
