import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { superAdminService } from "../../services/superAdminService";

export default function SuperAdminDashboard() {
    
    const { data, isLoading } = useQuery({
        queryKey: ['system-stats'],
        queryFn: superAdminService.getSystemStats
    });

    const stats = data?.stats || { totalRestaurants: 0, totalAdmins: 0, totalUsers: 0, revenue: 0 };

    if (isLoading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-quicksand font-bold text-gray-600">Welcome back, Super Admin.</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Restaurants" 
                    value={stats.totalRestaurants} 
                    icon="fa-store" 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Restaurant Admins" 
                    value={stats.totalAdmins} 
                    icon="fa-user-tie" 
                    color="bg-purple-500" 
                />
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon="fa-users" 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="System Revenue" 
                    value="$0" 
                    icon="fa-dollar-sign" 
                    color="bg-[#D4AF37]" 
                />
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Growth Analytics</h3>
                <div className="w-full h-[300px] bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-300 text-gray-400">
                    <div className="text-center">
                        <i className="fa-solid fa-chart-area text-4xl mb-2"></i>
                        <p>Chart Visualization Component Here</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${color} text-white flex items-center justify-center text-2xl shadow-lg shadow-gray-200`}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
            <div>
                <div className="text-gray-500 text-sm font-medium">{title}</div>
                <div className="text-2xl font-bold text-gray-800">{value}</div>
            </div>
        </div>
    );
}