import { API_BASE_URL } from "../config";

export async function getProgressLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.search) query.set("search", params.search);
  if (params.date) query.set("date", params.date);
  if (params.page) query.set("page", params.page);
  if (params.page_size) query.set("page_size", params.page_size);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/progress-logs/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch progress logs");
  return res.json();
}

