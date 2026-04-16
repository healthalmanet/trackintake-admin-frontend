const BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api/notifications`;

export const getAdminNotifications = async () => {
  const res = await fetch(`${BASE}/admin-notifications/`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};
