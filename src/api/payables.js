import { API_BASE_URL } from "../config";

const BASE = `${API_BASE_URL}/api/dashboard/payables`;

export const getPayables = async (filters = {}, page = 1, pageSize = 15) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (filters.type && filters.type !== "all") params.append("type", filters.type);
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  const res = await fetch(`${BASE}/?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch payables data");
  return res.json();
};

export const updatePayable = async (id, data) => {
  const res = await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update financial status");
  }
  return res.json();
};

