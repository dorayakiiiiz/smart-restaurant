import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import AccountSettingsModal from "../Shared/AccountSettings/AccountSettingsModal";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);

    // Menu cho Restaurant Admin (Chủ quán)
    const menuItems = [
        { label: 'Dashboard', icon: 'fa-chart-pie', path: '/system/admin/dashboard' },
        { label: 'Menu Management', icon: 'fa-book-open', path: '/system/admin/menu' },
        { label: 'Categories', icon: 'fa-list', path: '/system/admin/categories' },
        { label: 'Tables & QR', icon: 'fa-chair', path: '/system/admin/tables' },
        { label: 'Live Orders', icon: 'fa-bell-concierge', path: '/system/admin/orders' },
        { label: 'Kitchen View (KDS)', icon: 'fa-fire-burner', path: '/system/admin/kds' },
        { label: 'Staff', icon: 'fa-users-gear', path: '/system/admin/staff' },
        { label: 'Reports', icon: 'fa-file-invoice-dollar', path: '/system/admin/reports' },
        { label: 'Settings', icon: 'fa-gear', path: '/system/admin/settings' },
    ];

    const isActive = (path) => location.pathname.includes(path);

    const handleLogout = () => {
        logout();
        navigate('/auth/system/login');
    };

    return (
        <div 
            className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0 font-quicksand"
            onClick={() => setShowAvatarDropdown(false)}
        >
            {/* Restaurant Info Snippet */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-[#1a1a1a] text-[#D4AF37] flex items-center justify-center font-bold text-xl shadow-md">
                    <i className="fa-solid fa-store"></i>
                </div>
                <div className="relative">
                    <div className="font-bold text-gray-800 truncate text-sm">
                        {user?.restaurant?.name || "My Restaurant"}
                    </div>
                    <div 
                        className="text-sm text-gray-500 hover:text-gray-800 hover:font-bold cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setShowAvatarDropdown(!showAvatarDropdown) }}
                    >
                        {user?.fullName} 
                    </div>
                    {showAvatarDropdown && (
                        <>
                            <div 
                                className="absolute -left-6 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 transform origin-top-right transition-all animate-fade-in-down"
                                onClick={e => e.stopPropagation()}    
                            >
                                <div className="p-5 bg-[#1a1a1a] text-white">
                                    <div className="font-bold text-lg">{user?.fullName}</div>
                                    <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                                </div>
                                <div className="">
                                    <button
                                        onClick={() => {
                                            setShowAvatarDropdown(false);
                                            setShowAccountModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-6 py-5 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <i className="fa-solid fa-user-gear"></i>
                                        </div>
                                        Account Settings
                                    </button>
                                    <div className="border-t border-gray-100"></div>
                                    <button
                                        onClick={() => {
                                            setShowAvatarDropdown(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-6 py-5 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
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

            {/* Menu */}
            <div className="flex-1 py-2 px-3 space-y-1 overflow-y-auto no-scrollbar">
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

            {/* Account Settings Modal */}
            <AccountSettingsModal 
                isOpen={showAccountModal}
                onClose={() => setShowAccountModal(false)}
            />
        </div>
    );
}