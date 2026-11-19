import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionPayments from "./pages/SubscriptionPayments";
import Appointments from "./pages/Appointments";
import Blogs from "./pages/Blogs";
import AdminLogin from "./pages/AdminLogin";
import ApproveProfiles from "./pages/ApproveProfiles";
import Payables from "./pages/Payables";
import Settings from "./pages/Settings";
import PatientAssignment from "./pages/PatientAssignment";
import Notifications from "./pages/Notifications";
import NotificationToastContainer from "./components/NotificationToastContainer";
import { useNotificationPolling } from "./utils/useNotificationPolling";

export default function App() {
  const [activePage, setActivePage] = useState(() => sessionStorage.getItem("activePage") || "dashboard");
  const [pageState, setPageState] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAdmin") === "true";
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // REST API Notification Polling & In-App Alerts (every 1 minute)
  const {
    unreadCount,
    setUnreadCount,
    recentNotifications,
    toasts,
    removeToast,
    refresh: refreshNotifications,
  } = useNotificationPolling({
    enabled: isAuthenticated,
    intervalMs: 60000, // 1 minute interval
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
    setUser(null);
    setIsAuthenticated(false);
    setActivePage("dashboard");
  };

  const handleNavigate = (page) => {
    sessionStorage.setItem("activePage", page);
    setActivePage(page);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const handleNav = (e) => {
      setPageState(e.detail.state || {});
      handleNavigate(e.detail.page);
    };
    window.addEventListener("app-nav", handleNav);
    return () => window.removeEventListener("app-nav", handleNav);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard pageState={pageState} />;
      case "users": return <UserManagement pageState={pageState} />;
      case "assignments": return <PatientAssignment pageState={pageState} />;
      case "approvals": return <ApproveProfiles />;
      case "plans": return <SubscriptionPlans />;
      case "payments": return <SubscriptionPayments pageState={pageState} />;
      case "appointments": return <Appointments pageState={pageState} />;
      case "payables": return <Payables />;
      case "blogs": return <Blogs />;
      case "settings": return <Settings />;
      case "notifications": return <Notifications onUnreadChange={setUnreadCount} />;
      default: return <Dashboard pageState={pageState} />;
    }
  };

  return (
    <>
      <NotificationToastContainer toasts={toasts} onDismiss={removeToast} onNavigate={handleNavigate} />
      {!isAuthenticated ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">
          <Sidebar
            active={activePage}
            unreadCount={unreadCount}
            onNavigate={handleNavigate}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
            <Navbar
              unreadCount={unreadCount}
              activePage={activePage}
              notifications={recentNotifications}
              onNotificationClick={() => handleNavigate("notifications")}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onToggleSidebar={() => setSidebarOpen(prev => !prev)}
            />
            <main className="flex-1 overflow-y-auto">
              {renderPage()}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
