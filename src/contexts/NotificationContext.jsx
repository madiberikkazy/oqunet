import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { listNotifications } from "../firebase/firestore.js";
import { sendNotification } from "../utils/notificationService.js";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications from Firebase
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const items = await listNotifications(user.id);
      setNotifications(items);
      
      // Count unread
      const unread = items.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for new notifications (polling every 3 seconds)
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.id, loadNotifications]);

  // Show browser notification when new unread notification arrives
  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > unreadCount && unreadCount > 0) {
      const newest = unread[0];
      if (newest) {
        sendNotification(newest.title, {
          body: newest.body,
          tag: `notification-${newest.id}`,
        });
      }
    }
  }, [notifications, unreadCount]);

  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
  }, [notifications]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        loadNotifications,
        markAllAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  }
  return ctx;
}
