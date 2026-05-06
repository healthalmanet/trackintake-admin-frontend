import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionPayments from "./pages/SubscriptionPayments";
import Notifications from "./pages/Notifications";
import Nutritionists from "./pages/Nutritionists";
import DietPlansMain from "./pages/DietPlansMain";
import AdminLogin from "./pages/AdminLogin";

function PlaceholderPage({ title }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">This section is under construction.</p>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(() => sessionStorage.getItem("activePage") || "dashboard");
  const [pageState, setPageState] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAdmin") === "true";
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Fetch unread notification count on load
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/notifications/admin-notifications/`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then(data => {
        const list = data.results || [];
        setUnreadCount(list.filter(n => !n.is_read).length);
      })
      .catch(() => {});
  }, [isAuthenticated]);

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
      case "plans": return <SubscriptionPlans />;
      case "payments": return <SubscriptionPayments pageState={pageState} />;
      case "nutritionists": return <Nutritionists />;
      case "notifications": return <Notifications onUnreadChange={setUnreadCount} />;
      case "meals": return <PlaceholderPage title="Meals" />;
      case "diet": return <DietPlansMain />;
      case "progress": return <PlaceholderPage title="Progress" />;
      case "appointments": return <PlaceholderPage title="Appointments" />;
      case "blogs": return <PlaceholderPage title="Blogs" />;
      case "settings": return <PlaceholderPage title="Settings" />;
      default: return <PlaceholderPage title="Page" />;
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar active={activePage} onNavigate={handleNavigate} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar unreadCount={unreadCount} onNotificationClick={() => handleNavigate("notifications")} onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto">
              {renderPage()}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
