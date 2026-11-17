import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/dashboard/settings`;

export const getInhousePricingSettings = async (search = "") => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  const res = await fetch(`${BASE}/inhouse-pricing/?${params}`);
  if (!res.ok) throw new Error("Failed to load in-house pricing settings");
  return res.json();
};

export const updateInhousePricingSettings = async (payload) => {
  const res = await fetch(`${BASE}/inhouse-pricing/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to save in-house pricing settings");
  }
  return res.json();
};

