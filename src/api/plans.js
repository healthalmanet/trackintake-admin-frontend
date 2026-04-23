import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/subscription`;

export const getPlans = async () => {
  const res = await fetch(`${BASE}/plans/`);
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
};

export const createPlan = async (data) => {
  const res = await fetch(`${BASE}/plans/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plan");
  return res.json();
};

export const updatePlan = async (id, data) => {
  const res = await fetch(`${BASE}/plans/update/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plan");
  return res.json();
};
