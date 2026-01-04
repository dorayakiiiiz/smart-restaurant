// ============ SUMMARY STATS COMPONENT ============
export default function SummaryStats({ stats, isLoading, error }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-200"></div>
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-exclamation text-red-600 text-xl"></i>
                    <div>
                        <h3 className="font-bold text-red-800">Failed to load reports</h3>
                        <p className="text-sm text-red-600">{error.message || 'Please try again later'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div 
                    key={index} 
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition"
                >
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl ${stat.color} text-white flex items-center justify-center text-2xl shadow-lg shadow-gray-200`}>
                        <i className={`fa-solid ${stat.icon}`}></i>
                    </div>
                    
                    {/* Content */}
                    <div>
                        {/* Title */}
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                            {stat.title}
                        </div>
                        
                        {/* Value */}
                        <div className="text-2xl font-bold text-gray-800">
                            {stat.formatter(stat.value)}
                        </div>
                        
                        {/* Trend */}
                        {stat.renderTrend(stat.trend)}
                    </div>
                </div>
            ))}
        </div>
    );
}
