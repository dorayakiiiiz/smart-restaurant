import React from 'react';

export default function DashboardOverview() {
    // Mock data thống kê
    const stats = [
        { title: "Today's Revenue", value: "$1,250", icon: "fa-sack-dollar", color: "bg-green-500", trend: "+12%" },
        { title: "Active Orders", value: "12", icon: "fa-bell-concierge", color: "bg-blue-500", trend: "Now" },
        { title: "Total Orders", value: "45", icon: "fa-receipt", color: "bg-purple-500", trend: "Today" },
        { title: "Occupied Tables", value: "8/15", icon: "fa-chair", color: "bg-orange-500", trend: "53%" },
    ];

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
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">Revenue Analytics</h3>
                        <select className="text-sm border-gray-300 border rounded-lg px-3 py-1 bg-gray-50 outline-none">
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                        <i className="fa-solid fa-chart-area text-4xl mb-3"></i>
                        <p>Revenue Chart Visualization</p>
                    </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                        T{i}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">Table {i}</div>
                                        <div className="text-xs text-gray-500">3 items • $45.00</div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">Preparing</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition">
                        View All Orders
                    </button>
                </div>
            </div>
        </div>
    );
}