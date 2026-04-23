import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/notifications`;

export const getAdminNotifications = async (type = "admin") => {
  const res = await fetch(`${BASE}/admin-notifications/?type=${type}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${BASE}/admin-notifications/${id}/read/`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
};

export const markAllNotificationsRead = async (type = "admin") => {
  const res = await fetch(`${BASE}/admin-notifications/mark-all-read/?type=${type}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
  return res.json();
};
