import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../../../services/reportService";

// ============ PEAK HOUR DETAILS MODAL COMPONENT ============
export default function PeakHourDetailsModal({ hour, period, customDateStart, customDateEnd, getPeriodLabel, onClose }) {
    const { data: detailsData, isLoading } = useQuery({
        queryKey: ['peak-hour-details', hour, period, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getPeakHourDetails(
                hour,
                period,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        enabled: !!hour
    });

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0.00';
        return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <i className="fa-solid fa-clock text-blue-500"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#1a1a1a]">
                                {detailsData?.hourLabel || `${hour}:00`}
                            </h2>
                            <p className="text-sm text-gray-500">Orders in {getPeriodLabel().toLowerCase()}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && detailsData && detailsData.orders.length === 0 && (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i>
                            <p className="text-gray-500">No orders found for this hour</p>
                        </div>
                    )}

                    {!isLoading && detailsData && detailsData.orders.length > 0 && (
                        <div>
                            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">{detailsData.totalOrders}</div>
                                        <div className="text-xs text-gray-600">Total Orders</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {detailsData.orders.reduce((sum, o) => sum + o.itemCount, 0)}
                                        </div>
                                        <div className="text-xs text-gray-600">Total Items</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(detailsData.orders.reduce((sum, o) => sum + o.amount, 0))}
                                        </div>
                                        <div className="text-xs text-gray-600">Total Revenue</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                                    <div className="col-span-3">Time</div>
                                    <div className="col-span-3">Table</div>
                                    <div className="col-span-2 text-center">Items</div>
                                    <div className="col-span-4 text-right">Amount</div>
                                </div>

                                {detailsData.orders.map((order, index) => (
                                    <div 
                                        key={index} 
                                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors items-center"
                                    >
                                        <div className="col-span-3">
                                            <div className="text-sm font-medium text-gray-800">
                                                {formatTime(order.time)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(order.time)}
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-utensils text-gray-400 text-xs"></i>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {order.tableName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                                                {order.itemCount}
                                            </span>
                                        </div>
                                        <div className="col-span-4 text-right">
                                            <span className="text-sm font-bold text-gray-800">
                                                {formatCurrency(order.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
