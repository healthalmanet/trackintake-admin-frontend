import { API_BASE_URL } from "../config";

const BASE = `${API_BASE_URL}/api/dashboard/approvals`;

export const getApprovals = async (filters = {}, page = 1, pageSize = 15) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (filters.category && filters.category !== "all") params.append("category", filters.category);
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  const res = await fetch(`${BASE}/?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch approvals data");
  return res.json();
};

export const executeApprovalAction = async (id, action, extra = {}) => {
  const res = await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to execute approval action");
  }
  return res.json();
};

