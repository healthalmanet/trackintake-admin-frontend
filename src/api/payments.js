const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/subscription`;

export const getPayments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/usage/${query ? "?" + query : ""}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
};

export const getPaymentAnalytics = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/payments/analytics/${query ? "?" + query : ""}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
};
