import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar({ onLogout }) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notification */}
        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
          <span className="text-sm font-medium text-gray-700">Admin</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}
