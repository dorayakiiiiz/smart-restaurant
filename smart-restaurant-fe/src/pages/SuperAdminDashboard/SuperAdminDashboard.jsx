import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { superAdminService } from "../../services/superAdminService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SuperAdminDashboard() {
    const [chartFilter, setChartFilter] = useState('week');
    
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['system-stats', chartFilter],
        queryFn: () => superAdminService.getSystemStats(chartFilter)
    });

    const stats = statsData?.stats || { totalRestaurants: 0, totalAdmins: 0, totalUsers: 0, revenue: 0, revenueChart: [] };
    const chartData = stats.revenueChart || [];
    const maxVal = Math.max(...(chartData.map(d => d.value) || [0]));

    // Format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    // Custom Tooltip for Chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                    <p className="text-sm font-bold text-gray-800">{label}</p>
                    <p className="text-sm text-green-600 font-medium">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };


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
                    value={formatCurrency(stats.revenue)}
                    icon="fa-dollar-sign" 
                    color="bg-[#D4AF37]" 
                />
            </div>

            {/* Chart Area */}
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">System Revenue Analytics</h3>
                    <select 
                        className="text-sm border-gray-300 border rounded-lg px-3 py-1 bg-gray-50 outline-none cursor-pointer"
                        value={chartFilter}
                        onChange={(e) => setChartFilter(e.target.value)}
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
                
                <div style={{ width: '100%', height: 350 }}>
                    {chartData.length === 0 ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <i className="fa-solid fa-chart-simple text-4xl mb-3 text-gray-300"></i>
                            <p>No data available</p>
                         </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value === maxVal && maxVal > 0 ? '#22c55e' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
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