import {
  LayoutDashboard, Users, UtensilsCrossed, ClipboardList,
  TrendingUp, CalendarCheck, BookOpen, Bell, Settings, CreditCard, Stethoscope, Apple,
} from "lucide-react";

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
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900">
          Track<span className="text-orange-500">Intake</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, id }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                ${isActive
                  ? "bg-orange-50 text-orange-500"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
            >
              <Icon size={17} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Logout removed */}
    </aside>
  );
}
