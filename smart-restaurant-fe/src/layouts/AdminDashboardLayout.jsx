import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/AdminDashboard/Sidebar";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";

export default function AdminDashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isOwner = user?.restaurant?.isOwner;

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
                <Link to="/" className="text-[#D4AF37] font-momo text-2xl font-bold flex items-center gap-2">
                    <i className="fa-solid fa-utensils text-yellow-700"></i>
                    Smart Restaurant 
                    <span className="text-[10px] tracking-wider text-white font-bold border border-gray-600 px-2 py-0.5 rounded ml-2 uppercase bg-gray-800">
                        {isOwner ? 'Restaurant Owner' : 'Restaurant Admin'}
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400 text-sm hidden md:block">
                        {user?.restaurant?.name || "My Restaurant"}
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
        </div>
    );
}