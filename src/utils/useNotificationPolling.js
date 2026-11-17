import { useState, useEffect, useRef, useCallback } from "react";
import { getAdminNotifications } from "../api/notifications";

/**
 * Audio chime for new notifications
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  } catch {
    // Browser audio policy may prevent audio before user interaction
  }
}

/**
 * Custom hook to fetch and poll admin notifications via pure REST API every 1 minute
 */
export function useNotificationPolling({ intervalMs = 60000, enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const seenIdsRef = useRef(new Set());
  const isInitialFetch = useRef(true);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== id));
  }, []);

  const addToast = useCallback((notif) => {
    const toastId = `${Date.now()}_${Math.random()}`;
    const newToast = { ...notif, toastId };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      removeToast(toastId);
    }, 6000);
  }, [removeToast]);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      const data = await getAdminNotifications("admin");
      const list = data?.notifications || [];
      const count = typeof data?.unread_count === "number" ? data.unread_count : list.filter((n) => !n.is_read).length;

      setUnreadCount(count);
      setRecentNotifications(list.slice(0, 8));

      // Broadcast single centralized update event to whichever page is currently mounted
      window.dispatchEvent(
        new CustomEvent("app:notifications-updated", {
          detail: { notifications: list, unreadCount: count }
        })
      );

      // Check for brand new unread notifications that arrived since last fetch
      if (!isInitialFetch.current) {
        list.forEach((n) => {
          if (!n.is_read && !seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id);
            addToast(n);
            playNotificationSound();
          }
        });
      } else {
        // Record all existing unread notification IDs on first mount
        list.forEach((n) => {
          if (!n.is_read) seenIdsRef.current.add(n.id);
        });
        isInitialFetch.current = false;
      }
    } catch (err) {
      console.warn("[Notifications API Polling Error]:", err);
    }
  }, [enabled, addToast]);

  useEffect(() => {
    fetchNotifications();

    if (!enabled) return;

    const interval = setInterval(fetchNotifications, intervalMs);

    // Refetch immediately when admin switches back to the tab
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    // Refetch when other parts of the admin panel trigger a custom refresh
    const onManualRefresh = () => fetchNotifications();
    window.addEventListener("app:refresh-notifications", onManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("app:refresh-notifications", onManualRefresh);
    };
  }, [fetchNotifications, intervalMs, enabled]);

  return {
    unreadCount,
    setUnreadCount,
    recentNotifications,
    toasts,
    removeToast,
    refresh: fetchNotifications,
  };
}

