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
    if (!user.restaurantId) {
      return;
    }

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    // Join waiter room sau khi connected
    socket.emit("join_waiter", user.restaurantId);

    const handleInvalidate = () => {
      // Invalidate tất cả các query liên quan đến waiter
      queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-tables'] });
      
      // Play sound logic (giữ nguyên logic cũ của bạn nếu có)
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
    };

    // Listen events
    socket.on("new_order_alert", handleInvalidate);
    socket.on("kitchen:order_update", handleInvalidate);
    socket.on("order_served", handleInvalidate);
    socket.on("payment_requested", handleInvalidate);
    socket.on("session_update", handleInvalidate); // Thêm nếu có event này

    return () => {
      socket.off("new_order_alert", handleInvalidate);
      socket.off("kitchen:order_update", handleInvalidate);
      socket.off("order_served", handleInvalidate);
      socket.off("payment_requested", handleInvalidate);
      socket.off("session_update", handleInvalidate);
    };
  }, [user?.restaurantId, queryClient]);

  const tabs = [
    { path: "pending", label: "Pending" },
    { path: "accepted", label: "Accepted" },
    { path: "ready", label: "Ready" },
    { path: "tables", label: "Tables" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/auth/system/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Responsive container - mobile first, tablet friendly */}
      <div className="w-full md:max-w-2xl lg:max-w-3xl mx-auto bg-white min-h-screen md:shadow-2xl">
        {/* Header - Responsive */}
        <div className="bg-[#1a1a1a] p-3 sm:p-4 shadow-lg sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <i className="fa-solid fa-utensils text-yellow-700 text-lg sm:text-xl"></i>
              <div>
                <h1 className="text-[#D4AF37] font-momo text-base sm:text-lg font-bold leading-tight">
                  Smart Restaurant
                </h1>
                <span className="text-[8px] sm:text-[9px] tracking-wider text-white font-bold border border-gray-600 px-1.5 sm:px-2 py-0.5 rounded uppercase bg-gray-800 inline-block mt-0.5">
                  Waiter Panel
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative focus:outline-none"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#D4AF37] text-[#1a1a1a] flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg hover:bg-[#c9a332] transition">
                    {user?.fullName?.charAt(0) || "W"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]"></div>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    ></div>

                    {/* Menu - Responsive */}
                    <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="font-bold text-sm text-gray-800 truncate">
                          {user?.fullName || "Waiter"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Role: Waiter
                        </div>
                      </div>

                      {/* Logout Button */}
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition"
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket"></i>
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Responsive with Counts */}
        <div className="flex bg-white border-b border-gray-200 shadow-sm sticky top-[52px] sm:top-[80px] z-10">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex-1 px-1 sm:px-2 py-3 sm:py-3.5 text-center text-[10px] sm:text-xs font-bold transition-all relative ${
                  isActive
                    ? "text-[#D4AF37] bg-gray-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                    <span className="truncate">{tab.label}</span>
                    {counts[tab.path] > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold min-w-[16px] sm:min-w-[18px] ${
                          isActive
                            ? "bg-[#D4AF37] text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {counts[tab.path]}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] shadow-lg"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Content - Responsive padding */}
        <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-b from-gray-50 to-white min-h-screen">
          <Outlet context={{ setCounts }} />
        </div>
      </div>
    </div>
  );
}
