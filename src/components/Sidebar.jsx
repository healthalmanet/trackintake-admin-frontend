import {
  LayoutDashboard, Users, UtensilsCrossed,
  TrendingUp, CalendarCheck, BookOpen, Bell, Settings, CreditCard, Stethoscope, Apple, X, Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Users, label: "User Management", id: "users" },
  { icon: Stethoscope, label: "Nutritionists", id: "nutritionists" },
  { icon: CreditCard, label: "Subscription Plans", id: "plans" },
  { icon: CreditCard, label: "Subscription Payments", id: "payments" },
  { icon: UtensilsCrossed, label: "Meals", id: "meals" },
  { icon: Apple, label: "Diet Plans", id: "diet" },
  { icon: TrendingUp, label: "Progress", id: "progress" },
  { icon: CalendarCheck, label: "Appointments", id: "appointments" },
  { icon: BookOpen, label: "Blogs", id: "blogs" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function Sidebar({ active, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false); // Close drawer on mobile after navigation
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-100 flex flex-col shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-xl font-bold text-gray-900">
            Track<span className="text-orange-500">Intake</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, id }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                  ${isActive
                    ? "bg-orange-50 text-orange-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          {/* Logout button removed - will be added back later */}
        </div>
      </aside>
    </>
  );
}
