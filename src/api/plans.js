const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/subscription/plans`;

export const getPlans = async () => {
  const res = await fetch(`${BASE}/`);
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
};

export const createPlan = async (data) => {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plan");
  return res.json();
};

export const updatePlan = async (id, data) => {
  const res = await fetch(`${BASE}/update/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plan");
  return res.json();
};

export const deletePlan = async (id) => {
  const res = await fetch(`${BASE}/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete plan");
  return res.ok;
};
