const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/users`;

export const getUsers = async (filters = {}, page = 1, pageSize = 10) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (filters.search) params.append("search", filters.search);
  if (filters.role && filters.role !== "All") params.append("role", filters.role);
  if (filters.status && filters.status !== "All") params.append("status", filters.status.toLowerCase());
  if (filters.city) params.append("city", filters.city);
  if (filters.country) params.append("country", filters.country);
  if (filters.date) params.append("date", filters.date);
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);
  const res = await fetch(`${BASE}/?${params}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const getUser = async (id) => {
  const res = await fetch(`${BASE}/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(`${BASE}/create-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  const json = await res.json();
  return json.data || json;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${BASE}/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
};

export const assignNutritionist = async (userId, nutritionistId) => {
  const res = await fetch(`${BASE}/assign-nutritionist/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, nutritionist_id: nutritionistId }),
  });
  if (!res.ok) throw new Error("Failed to assign nutritionist");
  return res.json();
};

export const getNutritionists = async () => {
  const res = await fetch(`${BASE}/nutritionists/`);
  if (!res.ok) throw new Error("Failed to fetch nutritionists");
  return res.json();
};

export const getUserHealthProfile = async (userId) => {
  const res = await fetch(`${BASE}/${userId}/health-profile/`);
  if (!res.ok) throw new Error("Health profile not found");
  return res.json();
};

export const getUsersWithPaymentNoProfile = async () => {
  const res = await fetch(`${BASE}/payment-no-profile/`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export const getSubscribedUsers = async () => {
  const res = await fetch(`${BASE}/subscribed/`);
  if (!res.ok) throw new Error("Failed to fetch subscribed users");
  const data = await res.json();
  return data.results || [];
};
