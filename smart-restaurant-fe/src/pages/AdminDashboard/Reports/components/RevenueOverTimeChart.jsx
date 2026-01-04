import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function RevenueOverTimeChart({ data, isLoading, period, groupBy }) {
    
    // Format currency (match với formatCurrency trong ReportsPage)
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0.00';
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format currency for Y-axis (rút gọn: $1,234 thay vì $1,234.56)
    const formatYAxis = (value) => {
        if (!value && value !== 0) return '$0';
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toFixed(0)}`;
    };

    // Format date for X-axis
    const formatXAxis = (dateStr) => {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        
        if (groupBy === 'daily') {
            // Format: "Mon 1" or "Jan 1"
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const day = dayNames[date.getDay()];
            const dateNum = date.getDate();
            return `${day} ${dateNum}`;
        } else if (groupBy === 'weekly') {
            // Format: "Week 1", "Week 2"
            const weekMatch = dateStr.match(/W(\d+)/);
            return weekMatch ? `Week ${weekMatch[1]}` : dateStr;
        } else if (groupBy === 'monthly') {
            // Format: "Jan", "Feb"
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthNames[date.getMonth()];
        }
        
        return dateStr;
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-xs text-gray-600 mb-1 font-medium">{formatXAxis(data.date)}</p>
                    <p className="text-sm font-bold text-green-600 mb-1">
                        {formatCurrency(data.revenue)}
                    </p>
                    <p className="text-xs text-gray-600">
                        {data.orderCount} {data.orderCount === 1 ? 'order' : 'orders'}
                    </p>
                    {data.orderCount > 0 && (
                        <p className="text-xs text-gray-500">
                            Avg: {formatCurrency(data.revenue / data.orderCount)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Revenue Over Time</h3>
                        <p className="text-xs text-gray-500">Revenue trends by period</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
                        <p className="text-gray-500 text-sm">Loading chart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Revenue Over Time</h3>
                        <p className="text-xs text-gray-500">Revenue trends by period</p>
                    </div>
                    <div className="flex gap-2">
                        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${groupBy === 'daily' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            Daily
                        </button>
                        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${groupBy === 'weekly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            Weekly
                        </button>
                        <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${groupBy === 'monthly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            Monthly
                        </button>
                    </div>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <i className="fa-solid fa-chart-line text-4xl text-gray-300 mb-3"></i>
                        <p className="text-gray-500 text-sm">No revenue data available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Revenue Over Time</h3>
                    <p className="text-xs text-gray-500">Revenue trends by period</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        disabled
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-not-allowed ${groupBy === 'daily' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Daily
                    </button>
                    <button 
                        disabled
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-not-allowed ${groupBy === 'weekly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Weekly
                    </button>
                    <button 
                        disabled
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-not-allowed ${groupBy === 'monthly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 40, left: 20, bottom: 10 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={formatXAxis}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#e5e7eb"
                        tickLine={false}
                        padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                        tickFormatter={formatYAxis}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#e5e7eb"
                        tickLine={false}
                        axisLine={false}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
