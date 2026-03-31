import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionPayments from "./pages/SubscriptionPayments";
import Login from "./pages/Login";

function PlaceholderPage({ title }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">This section is under construction.</p>
    </div>
  );
}

const getPage = (activePage, pageState) => {
  switch (activePage) {
    case "dashboard": return <Dashboard pageState={pageState} />;
    case "users": return <UserManagement pageState={pageState} />;
    case "plans": return <SubscriptionPlans />;
    case "payments": return <SubscriptionPayments pageState={pageState} />;
    case "meals": return <PlaceholderPage title="Meals" />;
    case "diet": return <PlaceholderPage title="Diet Plans" />;
    case "progress": return <PlaceholderPage title="Progress" />;
    case "appointments": return <PlaceholderPage title="Appointments" />;
    case "blogs": return <PlaceholderPage title="Blogs" />;
    case "notifications": return <PlaceholderPage title="Notifications" />;
    case "settings": return <PlaceholderPage title="Settings" />;
    default: return <PlaceholderPage title="Page" />;
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [activePage, setActivePage] = useState("dashboard");
  const [pageState, setPageState] = useState({});

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const handleNav = (e) => {
      setPageState(e.detail.state || {});
      setActivePage(e.detail.page);
    };
    window.addEventListener("app-nav", handleNav);
    return () => window.removeEventListener("app-nav", handleNav);
  }, []);

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar active={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onLogout={() => setIsLoggedIn(false)} />
        <main className="flex-1 overflow-y-auto">
          {getPage(activePage, pageState)}
        </main>
      </div>
    </div>
  );
}
