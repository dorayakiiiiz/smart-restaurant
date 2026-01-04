import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../../../services/reportService";

// ============ ITEM DETAILS MODAL COMPONENT ============
export default function ItemDetailsModal({ 
    item, 
    period, 
    customDateStart, 
    customDateEnd, 
    getPeriodLabel, 
    formatCurrency, 
    renderTrend, 
    onClose 
}) {
    const { data: detailsData, isLoading } = useQuery({
        queryKey: ['item-details', item.menuItemId, period, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getItemDetails(
                item.menuItemId,
                period,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        enabled: !!item.menuItemId
    });

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
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                        {item.image ? (
                            <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-20 h-20 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                                <i className="fa-solid fa-utensils text-3xl text-gray-400"></i>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-1">{item.name}</h2>
                            <p className="text-sm text-gray-500 mb-2">{item.category?.name || 'Uncategorized'} • {formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    item.rank === 1 ? 'bg-red-500 text-white' :
                                    item.rank === 2 ? 'bg-orange-500 text-white' :
                                    item.rank === 3 ? 'bg-yellow-500 text-white' :
                                    'bg-gray-400 text-white'
                                }`}>
                                    {item.rank}
                                </div>
                                <span className="text-xs text-gray-500">Rank in {getPeriodLabel().toLowerCase()}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-100">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{item.totalQuantity}</div>
                            <div className="text-xs text-gray-600 mt-1">Total Sold</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{item.orderCount}</div>
                            <div className="text-xs text-gray-600 mt-1">Orders</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(item.totalRevenue)}</div>
                            <div className="text-xs text-gray-600 mt-1">Revenue</div>
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center">
                                {renderTrend(item.trend)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Trend</div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h3>
                    
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && detailsData && detailsData.orders.length === 0 && (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i>
                            <p className="text-gray-500">No orders found for this item</p>
                        </div>
                    )}

                    {!isLoading && detailsData && detailsData.orders.length > 0 && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                                <div className="col-span-3">Time</div>
                                <div className="col-span-2">Table</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            {detailsData.orders.map((order, index) => (
                                <div 
                                    key={index} 
                                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors items-center"
                                >
                                    <div className="col-span-3">
                                        <div className="text-sm font-medium text-gray-800">
                                            {formatTime(order.createdAt)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-utensils text-gray-400 text-xs"></i>
                                            <span className="text-sm font-medium text-gray-800">
                                                {order.tableName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                                            {order.quantity}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-sm text-gray-600">
                                            {formatCurrency(order.price)}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className="text-sm font-bold text-gray-800">
                                            {formatCurrency(order.itemTotal)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
