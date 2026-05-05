import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

export default function Navbar({ onLogout, unreadCount = 0, onNotificationClick }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shadow-sm">
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification */}
        <button onClick={onNotificationClick} className="relative p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
          <Bell size={18} className="text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer border-t border-gray-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
