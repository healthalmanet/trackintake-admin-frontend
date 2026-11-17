import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/dashboard/appointments`;

export const getAppointments = async (filters = {}, page = 1, pageSize = 15) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (filters.search) params.append("search", filters.search);
  if (filters.status && filters.status !== "All") params.append("status", filters.status);
  if (filters.category && filters.category !== "All") params.append("category", filters.category);
  if (filters.type && filters.type !== "All") params.append("type", filters.type);
  if (filters.from_date) params.append("from_date", filters.from_date);
  if (filters.to_date) params.append("to_date", filters.to_date);
  if (filters.time_frame && filters.time_frame !== "all") params.append("time_frame", filters.time_frame);

  const res = await fetch(`${BASE}/?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return res.json();
};

export const getAppointment = async (id) => {
  const res = await fetch(`${BASE}/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch appointment");
  return res.json();
};

export const updateAppointment = async (id, data) => {
  const res = await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update appointment");
  return res.json();
};

