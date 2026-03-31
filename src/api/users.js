const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/users`;

export const getUsers = async (search = "") => {
  const url = search ? `${BASE}/?search=${encodeURIComponent(search)}` : `${BASE}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${BASE}/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.ok;
};

export const updateUserStatus = async (id, status) => {
  const res = await fetch(`${BASE}/${id}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
};

export const getUserHealthProfile = async (userId) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/users/${userId}/health-profile/`);
  if (!res.ok) throw new Error("Profile not found");
  return res.json();
};
