import { useState } from "react";
import PeakHourDetailsModal from "./PeakHourDetailsModal";

// ============ PEAK HOURS CHART COMPONENT ============
export default function PeakHoursChart({ data, isLoading, period, customDateStart, customDateEnd, getPeriodLabel }) {
    const [selectedHour, setSelectedHour] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleBarClick = (hour) => {
        setSelectedHour(hour);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Peak Hours</h3>
                <p className="text-xs text-gray-500 mb-4">Loading...</p>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3">
                            <div className="w-16 h-4 bg-gray-200 rounded"></div>
                            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Peak Hours</h3>
                <p className="text-xs text-gray-500 mb-4">Total orders in {getPeriodLabel().toLowerCase()}</p>
                <div className="text-center py-12">
                    <i className="fa-solid fa-clock text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500 text-sm">No peak hours data available</p>
                </div>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(item => item.orderCount));
    const sortedData = [...data].sort((a, b) => b.orderCount - a.orderCount);
    const topPeakHours = sortedData.slice(0, 3).map(item => item.hour);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Peak Hours</h3>
            <p className="text-xs text-gray-500 mb-4">Total orders in {getPeriodLabel().toLowerCase()}</p>
            <div className="space-y-3">
                {data.map((item) => {
                    const isPeak = topPeakHours.includes(item.hour);
                    const barWidth = maxCount > 0 ? Math.round((item.orderCount / maxCount) * 100) : 0;
                    
                    return (
                        <div 
                            key={item.hour} 
                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => handleBarClick(item.hour)}
                        >
                            <span className="text-sm font-medium text-gray-600 w-16 text-right">
                                {item.hourLabel}
                            </span>
                            
                            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isPeak 
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                                            : 'bg-gradient-to-r from-blue-300 to-blue-400'
                                    }`}
                                    style={{ width: `${barWidth}%` }}
                                ></div>
                            </div>
                            
                            <span className="text-sm font-bold text-gray-800 w-12 text-right">
                                {item.orderCount}
                            </span>
                        </div>
                    );
                })}
            </div>

            {showModal && selectedHour !== null && (
                <PeakHourDetailsModal
                    hour={selectedHour}
                    period={period}
                    customDateStart={customDateStart}
                    customDateEnd={customDateEnd}
                    getPeriodLabel={getPeriodLabel}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
