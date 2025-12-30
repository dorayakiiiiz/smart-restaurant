import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import { useQueryClient } from "@tanstack/react-query";

export default function WaiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [counts, setCounts] = useState({
    pending: 0,
    accepted: 0,
    ready: 0,
    tables: 0,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    // Redirect to pending tab by default
    if (location.pathname === "/waiter/dashboard") {
      navigate("/waiter/dashboard/pending", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Socket setup
  useEffect(() => {
    if (!user?.restaurantId) return;
    if (!user?.restaurantId) return;

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    // Join waiter room
    socket.emit("join_waiter", user.restaurantId);

    const handleInvalidate = () => {
      // Invalidate tất cả các query liên quan đến waiter
      queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-tables'] });
      
      // Play sound logic
    //   const audio = new Audio('/sounds/notification.mp3');
    //   audio.play().catch(e => console.log('Audio play failed', e));
    };

    // Listen events
    socket.on("new_order_alert", handleInvalidate);
    socket.on("kitchen:order_update", handleInvalidate);
    socket.on("order_served", handleInvalidate);
    socket.on("payment_requested", handleInvalidate);
    socket.on("session_update", handleInvalidate);

    return () => {
      socket.off("new_order_alert", handleInvalidate);
      socket.off("kitchen:order_update", handleInvalidate);
      socket.off("order_served", handleInvalidate);
      socket.off("payment_requested", handleInvalidate);
      socket.off("session_update", handleInvalidate);
    };
  }, [user?.restaurantId, queryClient]);

  const tabs = [
    { path: "pending", label: "Pending", icon: "fa-clipboard-list" },
    { path: "accepted", label: "Accept", icon: "fa-fire-burner" },
    { path: "ready", label: "Ready", icon: "fa-bell-concierge" },
    { path: "tables", label: "Tables", icon: "fa-chair" },
    { path: "pending", label: "Pending", icon: "fa-clipboard-list" },
    { path: "accepted", label: "Accept", icon: "fa-fire-burner" },
    { path: "ready", label: "Ready", icon: "fa-bell-concierge" },
    { path: "tables", label: "Tables", icon: "fa-chair" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/auth/system/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-quicksand flex flex-col">
      {/* Header - Full Width, Modern Dark Theme */}
      <div className="bg-[#1a1a1a] text-white shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 py-3 flex justify-between items-center">
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b49020] flex items-center justify-center shadow-lg shadow-yellow-900/20">
              <i className="fa-solid fa-utensils text-[#1a1a1a] text-lg"></i>
            </div>
            <div>
              <h1 className="text-[#D4AF37] font-momo text-xl font-bold leading-none tracking-wide">
                Smart Restaurant
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300 uppercase tracking-wider">
    <div className="min-h-screen bg-[#f4f6f8] font-quicksand flex flex-col">
      {/* Header - Full Width, Modern Dark Theme */}
      <div className="bg-[#1a1a1a] text-white shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 py-3 flex justify-between items-center">
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b49020] flex items-center justify-center shadow-lg shadow-yellow-900/20">
              <i className="fa-solid fa-utensils text-[#1a1a1a] text-lg"></i>
            </div>
            <div>
              <h1 className="text-[#D4AF37] font-momo text-xl font-bold leading-none tracking-wide">
                Smart Restaurant
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300 uppercase tracking-wider">
                  Waiter Panel
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition">{user?.fullName || "Waiter"}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold">Staff ID: #{user?._id?.slice(-4)}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-lg group-hover:bg-gray-700 transition">
                {user?.fullName?.charAt(0) || "W"}
              </div>
            </button>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition">{user?.fullName || "Waiter"}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold">Staff ID: #{user?._id?.slice(-4)}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-lg group-hover:bg-gray-700 transition">
                {user?.fullName?.charAt(0) || "W"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 transform origin-top-right transition-all animate-fade-in-down">
                  <div className="p-5 bg-[#1a1a1a] text-white">
                    <div className="font-bold text-lg">{user?.fullName}</div>
                    <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 transform origin-top-right transition-all animate-fade-in-down">
                  <div className="p-5 bg-[#1a1a1a] text-white">
                    <div className="font-bold text-lg">{user?.fullName}</div>
                    <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Modern Pill Style */}
        <div className="w-full px-2 pb-2 bg-[#1a1a1a]">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar p-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex-1 min-w-[80px] relative group flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[#D4AF37] text-[#1a1a1a] shadow-lg shadow-yellow-900/20 translate-y-0"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <i className={`fa-solid ${tab.icon} text-lg mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}></i>
                      {counts[tab.path] > 0 && (
                        <span className={`absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full border-2 ${
                          isActive 
                            ? "bg-red-600 text-white border-[#D4AF37]" 
                            : "bg-[#D4AF37] text-[#1a1a1a] border-[#1a1a1a]"
                        }`}>
                          {counts[tab.path]}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        {/* Navigation Tabs - Modern Pill Style */}
        <div className="w-full px-2 pb-2 bg-[#1a1a1a]">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar p-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex-1 min-w-[80px] relative group flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[#D4AF37] text-[#1a1a1a] shadow-lg shadow-yellow-900/20 translate-y-0"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <i className={`fa-solid ${tab.icon} text-lg mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}></i>
                      {counts[tab.path] > 0 && (
                        <span className={`absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full border-2 ${
                          isActive 
                            ? "bg-red-600 text-white border-[#D4AF37]" 
                            : "bg-[#D4AF37] text-[#1a1a1a] border-[#1a1a1a]"
                        }`}>
                          {counts[tab.path]}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area - Full Width, Responsive Grid handled in sub-pages */}
      <div className="flex-1 w-full p-3 sm:p-4 md:p-6 overflow-y-auto">
        <Outlet context={{ setCounts }} />
      </div>

      {/* Content Area - Full Width, Responsive Grid handled in sub-pages */}
      <div className="flex-1 w-full p-3 sm:p-4 md:p-6 overflow-y-auto">
        <Outlet context={{ setCounts }} />
      </div>
    </div>
  );
}