import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/dashboard/assignments`;

export const getAssignments = async ({
  search = "",
  nutritionist_id = "",
  plan = "",
  tab = "all",
  page = 1,
  page_size = 15
} = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (nutritionist_id) params.append("nutritionist_id", nutritionist_id);
  if (plan) params.append("plan", plan);
  if (tab) params.append("tab", tab);
  if (page) params.append("page", page);
  if (page_size) params.append("page_size", page_size);

  const res = await fetch(`${BASE}/?${params}`);
  if (!res.ok) throw new Error("Failed to load patient assignments");
  return res.json();
};

export const batchAssignPatients = async (nutritionistId, patientIds) => {
  const res = await fetch(`${BASE}/batch-assign/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nutritionist_id: nutritionistId,
      patient_ids: patientIds,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to assign patients");
  }
  return res.json();
};

export const unassignPatients = async (patientIds) => {
  const res = await fetch(`${BASE}/unassign/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_ids: Array.isArray(patientIds) ? patientIds : [patientIds],
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to unassign patients");
  }
  return res.json();
};

