import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/AdminDashboard/Sidebar";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";
import AccountSettingsModal from "../components/Shared/AccountSettings/AccountSettingsModal";

export default function AdminDashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);

    useEffect(() => {
        if (!user?.restaurantId) return;
        
        if (!socket.connected) socket.connect();
        socket.emit("join_admin", user.restaurantId);

        return () => {
            socket.disconnect();
        };
    }, [user?.restaurantId]);
    
    const getTitle = () => {
        const path = location.pathname;
        if (path.includes('/menu')) return 'Menu Management';
        if (path.includes('/categories')) return 'Category Management';
        if (path.includes('/tables')) return 'Table Management';
        if (path.includes('/orders')) return 'Live Orders';
        if (path.includes('/kds')) return 'Kitchen Display System';
        if (path.includes('/staff')) return 'Staff Management';
        if (path.includes('/reports')) return 'Analytics & Reports';
        if (path.includes('/settings')) return 'Restaurant Settings';
        return 'Dashboard Overview';
    };

    const handleLogout = () => {
        logout();
        navigate('/auth/system/login');
    };

    return (
        <div className="w-full h-screen flex flex-col font-quicksand font-medium bg-[#f8f9fa]">
            {/* Header */}
            <div className="bg-[#1a1a1a] h-[70px] w-full flex items-center justify-between px-6 shadow-md z-20">
                <Link to="/system/admin/dashboard" className="text-[#D4AF37] font-momo text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-utensils text-yellow-700"></i>
                    Smart Restaurant 
                    <span className="text-[10px] tracking-wider text-white font-bold border border-gray-600 px-2 py-0.5 rounded ml-2 uppercase bg-gray-800">
                        Restaurant Admin
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400 text-sm hidden md:block">
                        {user?.restaurant?.name || "My Restaurant"}
                    </div>
                    
                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                            className="flex items-center gap-3 focus:outline-none group"
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition">{user?.fullName || "Admin"}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Admin ID: #{user?._id?.slice(-4)}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-lg group-hover:bg-gray-700 transition overflow-hidden">
                                {user?.avatar?.url ? (
                                    <img src={user.avatar.url} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    user?.fullName?.charAt(0) || "A"
                                )}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showAvatarDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowAvatarDropdown(false)}></div>
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 transform origin-top-right transition-all animate-fade-in-down">
                                    <div className="p-5 bg-[#1a1a1a] text-white">
                                        <div className="font-bold text-lg">{user?.fullName}</div>
                                        <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setShowAvatarDropdown(false);
                                                setShowAccountModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                                <i className="fa-solid fa-user-gear"></i>
                                            </div>
                                            Account Settings
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setShowAvatarDropdown(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
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
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-[#f4f6f8] overflow-hidden relative">
                    {/* Page Header */}
                    <div className="h-[70px] flex justify-between items-center px-8 bg-white border-b border-gray-200 shrink-0">
                        <h1 className="font-bold text-2xl text-[#1a1a1a] font-momo">{getTitle()}</h1>
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
                                <i className="fa-regular fa-bell"></i>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className={`flex-1 overflow-y-auto ${!location.pathname.includes('/kds') && 'p-6 md:p-8'}`}>
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Account Settings Modal */}
            <AccountSettingsModal 
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
            />
        </div>
    );
}