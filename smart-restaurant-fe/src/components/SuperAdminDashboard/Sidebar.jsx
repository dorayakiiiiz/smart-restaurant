import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const menuItems = [
        { label: 'Dashboard', icon: 'fa-chart-line', path: '/system/super/admin/dashboard' },
        { label: 'Restaurants', icon: 'fa-store', path: '/system/super/admin/admins' },
        { label: 'Settings', icon: 'fa-gear', path: '/system/super/admin/settings' },
    ];

    const isActive = (path) => location.pathname.includes(path);

    const handleLogout = () => {
        logout();
        navigate('/auth/system/login');
    };

    return (
        <div className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
            {/* User Profile Snippet */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-lg">
                    {user?.fullName?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden">
                    <div className="font-bold text-gray-800 truncate">{user?.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item, index) => (
                    <Link 
                        key={index}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive(item.path) 
                            ? 'font-bold bg-gray-700 text-[#D4AF37] shadow-md' 
                            : 'font-semibold text-gray-600 hover:bg-gray-100 hover:text-black'
                        }`}
                    >
                        <i className={`fa-solid ${item.icon} w-6 text-center`}></i>
                        {item.label}
                    </Link>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition"
                >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    Logout
                </button>
            </div>
        </div>
    );
}