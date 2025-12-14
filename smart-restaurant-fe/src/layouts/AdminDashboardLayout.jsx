import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/AdminDashboard/Sidebar";

export default function AdminDashboardLayout() {
    const location = useLocation();
    
    const getTitle = () => {
        if (location.pathname.includes('admins')) return 'Restaurant Owners';
        if (location.pathname.includes('settings')) return 'System Settings';
        return 'System Overview';
    };

    return (
        <div className="w-full h-screen flex flex-col font-quicksand font-medium bg-[#f8f9fa]">
            {/* Header */}
            <div className="bg-[#1a1a1a] h-[70px] w-full flex items-center justify-between px-6 shadow-md z-20">
                <Link to="/" className="text-[#D4AF37] font-momo text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-utensils"></i>
                    Smart Restaurant <span className="text-xs text-gray-400 font-normal border border-gray-600 px-2 py-0.5 rounded ml-2">SUPER ADMIN</span>
                </Link>
                <div className="text-white text-sm opacity-70">
                    System Management Portal
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
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <i className="fa-regular fa-bell"></i>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}