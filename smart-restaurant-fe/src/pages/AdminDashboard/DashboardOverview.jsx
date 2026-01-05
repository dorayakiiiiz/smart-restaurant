import React from 'react';
import { restaurantService } from '../../services/restaurantService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import RecentOrdersTable from './RecentOrdersTable';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
export default function DashboardOverview() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [chartFilter, setChartFilter] = useState('week');

    const { data: statsData, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['dashboardStats', chartFilter], 
        queryFn: () => restaurantService.getDashboardStats(chartFilter),
        refetchOnWindowFocus: false, // Tắt tự động fetch khi focus lại tab
        refetchInterval: 5000,
    });

    // 2. Hàm làm mới dữ liệu (Mutation logic)
    const handleRefreshStats = () => {
        refetch();
    };

    // Format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    // Map dữ liệu từ API vào cấu trúc hiển thị
    const stats = [
        { 
            title: "Today's Revenue", 
            value: isLoading ? "..." : formatCurrency(statsData?.revenue), 
            icon: "fa-sack-dollar", 
            color: "bg-green-500", 
            trend: "Today" 
        },
        { 
            title: "Active Orders", 
            value: isLoading ? "..." : statsData?.activeOrders || 0, 
            icon: "fa-bell-concierge", 
            color: "bg-blue-500", 
            trend: "Now" 
        },
        { 
            title: "Total Orders", 
            value: isLoading ? "..." : statsData?.totalOrders || 0, 
            icon: "fa-receipt", 
            color: "bg-purple-500", 
            trend: "Today" 
        },
        { 
            title: "Occupied Tables", 
            value: isLoading ? "..." : `${statsData?.occupiedTables || 0}/${statsData?.totalTables || 0}`, 
            icon: "fa-chair", 
            color: "bg-orange-500", 
            trend: statsData?.totalTables > 0 
                ? `${Math.round((statsData.occupiedTables / statsData.totalTables) * 100)}%` 
                : "0%" 
        },
    ];


    // Helper render top selling item
    const renderTopSellingItem = (item, index) => (
        <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100 mb-2 last:mb-0">
            <div className="flex items-center gap-4">
                {/* Các index */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-orange-500' : 
                    index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}>
                    {index + 1}
                </div>
                {/* Img */}
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <i className="fa-solid fa-utensils"></i>
                    </div>
                )}
                {/* Thông tin món */}
                <div>
                    <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.totalQuantity} orders | {formatCurrency(item.totalRevenue)}</div>
                </div>
            </div>
        </div>
    );


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

    const maxVal = Math.max(...(statsData?.revenueChart?.map(d => d.value) || [0]));

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800">Business Snapshot</h2>
                <p className="text-gray-500 text-sm">Here is what's happening in your restaurant today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                        <div className={`w-14 h-14 rounded-xl ${stat.color} text-white flex items-center justify-center text-2xl shadow-lg shadow-gray-200`}>
                            <i className={`fa-solid ${stat.icon}`}></i>
                        </div>
                        <div>
                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">{stat.title}</div>
                            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                            <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity & Chart Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Revenue Analytics</h3>
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
                    
                    {/* Container với style cứng để tránh lỗi Recharts */}
                    <div style={{ width: '100%', height: 350 }}>
                         {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                        ) : !statsData?.revenueChart || statsData.revenueChart.length === 0 ? (
                             <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <i className="fa-solid fa-chart-simple text-4xl mb-3 text-gray-300"></i>
                                <p>No data available</p>
                             </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statsData.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        {statsData.revenueChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value === maxVal && maxVal > 0 ? '#22c55e' : '#ef4444'} />
                                        ))}
                                         </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

                {/* Top selling */}
                <div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800">Top Selling Items</h3>
                            <button className="text-xs font-bold text-red-500 hover:text-red-700"
                                    onClick={() => navigate('/system/admin/menu')}
                                >View All
                            </button>
                        </div>
                        
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-400">Loading...</div>
                        ) : statsData?.topSellingItems?.length > 0 ? (
                            <div className="flex flex-col">
                                {statsData.topSellingItems.map((item, index) => renderTopSellingItem(item, index))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                <i className="fa-solid fa-basket-shopping text-2xl mb-2"></i>
                                <p>No sales data yet</p>
                            </div>
                        )}
                    </div>    
                </div>


            </div>
                {/* Recent Orders List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-100%">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-4">
                        <RecentOrdersTable 
                            orders={statsData?.recentOrders || []} 
                            isLoading={isLoading} 
                        />
                    </div>
                </div>
        </div>
    );
}