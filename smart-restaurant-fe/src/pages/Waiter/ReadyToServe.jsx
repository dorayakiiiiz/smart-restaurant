import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function ReadyToServe() {
    const { reloadTrigger, setCounts } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const options = { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('en-US', options).replace(',', ' •');
    };

    useEffect(() => {
        loadOrders();
    }, [reloadTrigger]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getReadyOrders();
            const ordersList = response.data.orders || [];
            
            // Hiển thị orders có ít nhất 1 item ready HOẶC tất cả items served (chưa complete)
            const ordersToDisplay = ordersList.filter(order => {
                const hasReadyItems = order.items?.some(item => item.status === 'ready');
                const hasServedItems = order.items?.some(item => item.status === 'served');
                const hasPreparingItems = order.items?.some(item => item.status === 'preparing');
                
                // Hiển thị nếu có ready items HOẶC (có served items VÀ không còn preparing items)
                return hasReadyItems || (hasServedItems && !hasPreparingItems);
            });
            
            setOrders(ordersToDisplay);
            
            // Đếm tổng số items ready (không phải số orders)
            const totalReadyItems = ordersToDisplay.reduce((sum, order) => {
                const readyCount = order.items?.filter(item => item.status === 'ready').length || 0;
                return sum + readyCount;
            }, 0);
            
            // Update count in parent
            if (setCounts) {
                setCounts(prev => ({ ...prev, ready: totalReadyItems }));
            }
        } catch (error) {
            // Error loading orders
        } finally {
            setLoading(false);
        }
    };

    const handleMarkServed = async (orderId, readyItemsCount) => {
        try {
            await waiterService.markAsServed(orderId);
            
            const message = `Served ${readyItemsCount} item${readyItemsCount > 1 ? 's' : ''} successfully!`;
            
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
            
            loadOrders();
        } catch (error) {
            alert('Failed to mark as served. Please try again.');
        }
    };

    const handleMarkComplete = async (orderId) => {
        try {
            await waiterService.markOrderComplete(orderId);
            
            const message = 'Order completed! Customer notified.';
            
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
            
            loadOrders();
        } catch (error) {
            alert('Failed to mark as complete. Please try again.');
        }
    };

    // Calculate summary stats - chỉ đếm items ready
    const calculateStats = () => {
        let totalItems = 0;
        let totalOrders = orders.length;

        orders.forEach(order => {
            order.items?.forEach(item => {
                if (item.status === 'ready') {
                    totalItems += item.quantity;
                }
            });
        });

        return { totalItems, totalOrders };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-[#1a1a1a] mb-4"></i>
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4 animate-bounce">🍽️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">All served!</h3>
                <p className="text-gray-500">No orders ready to serve</p>
            </div>
        );
    }

    return (
        <>
            {/* Summary Card with Tailwind animations */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center group">
                        <i className="fa-solid fa-bell-concierge text-green-600 text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"></i>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                            Ready to Serve
                            {orders.length > 0 && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.totalOrders}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#D4AF37] transition-colors">Orders</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.totalItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-green-500 transition-colors">Ready Items</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2 animate-pulse">
                                <i className="fa-solid fa-rocket text-green-600"></i>
                                <span className="text-xs font-semibold text-gray-700">Serve ready items now!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {orders.map(order => {
                // Hiển thị TẤT CẢ items (ready + served)
                const readyItems = order.items?.filter(item => item.status === 'ready') || [];
                const servedItems = order.items?.filter(item => item.status === 'served') || [];
                const preparingItems = order.items?.filter(item => item.status === 'preparing') || [];
                const allDisplayItems = [...servedItems, ...readyItems]; // Served trên, ready dưới
                
                if (allDisplayItems.length === 0) return null;
                
                return (
                    <div key={order._id} className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm border-2 border-green-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-bold group-hover:scale-105 transition-transform duration-300 shadow-md">
                                    {order.sessionId?.tableId?.name || 'N/A'}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        #{order._id.slice(-6)}
                                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <i className="fa-solid fa-utensils text-[10px]"></i>
                                        {readyItems.length} ready • {servedItems.length} served
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1.5 animate-pulse">
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                    READY
                                </span>
                                <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                    {formatDateTime(order.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Items - Hiển thị served (mờ) + ready */}
                        <div className="p-4 bg-white">
                            {allDisplayItems.map((item, idx) => {
                                const isServed = item.status === 'served';
                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex justify-between items-start py-3 border-b border-gray-100 last:border-0 transition-colors duration-200 rounded-lg px-2 -mx-2 group ${
                                            isServed ? 'opacity-40' : 'hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="flex gap-3 flex-1 items-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold min-w-[45px] text-center transition-all duration-300 shadow-sm ${
                                                isServed 
                                                    ? 'bg-gray-200 text-gray-500' 
                                                    : 'bg-gray-100 text-gray-700 group-hover:scale-110 group-hover:bg-green-100 group-hover:text-green-700'
                                            }`}>
                                                {item.quantity}x
                                            </span>
                                            <div className="flex-1">
                                                <div className={`font-semibold text-sm flex items-center gap-2 transition-colors ${
                                                    isServed ? 'text-gray-500 line-through' : 'text-gray-800 group-hover:text-green-700'
                                                }`}>
                                                    {item.name}
                                                    {isServed ? (
                                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                                            <i className="fa-solid fa-check text-[8px]"></i>
                                                            SERVED
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                                            <i className="fa-solid fa-check text-[8px]"></i>
                                                            READY
                                                        </span>
                                                    )}
                                                </div>
                                                {item.modifiers?.length > 0 && (
                                                    <div className={`text-xs mt-1.5 space-y-0.5 ${isServed ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {item.modifiers.map((m, i) => (
                                                            <div key={i} className="flex items-center gap-1">
                                                                <i className="fa-solid fa-circle text-[4px] text-gray-400"></i>
                                                                <span>{m.name}: {m.option}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.note && (
                                                    <div className={`text-xs italic mt-1.5 px-2 py-1 rounded ${
                                                        isServed ? 'text-gray-400 bg-gray-100' : 'text-green-600 bg-green-50'
                                                    }`}>
                                                        <i className="fa-solid fa-note-sticky mr-1"></i>
                                                        {item.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ml-2 transition-all duration-300 ${
                                            isServed 
                                                ? 'text-gray-400 line-through' 
                                                : 'text-gray-800 group-hover:text-[#D4AF37] group-hover:scale-110'
                                        }`}>
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info - Hiển thị items còn lại đang preparing */}
                        {order.items?.some(item => item.status === 'preparing') && (
                            <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100">
                                <div className="text-xs text-yellow-700 flex items-center gap-2">
                                    <i className="fa-solid fa-fire animate-pulse"></i>
                                    <span className="font-medium">
                                        {order.items.filter(item => item.status === 'preparing').length} more item(s) still preparing
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action */}
                        <div className="p-4 bg-gray-50">
                            {readyItems.length > 0 ? (
                                <button
                                    onClick={() => handleMarkServed(order._id, readyItems.length)}
                                    className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-[#333] transition-all duration-300 active:scale-95 hover:shadow-xl"
                                >
                                    <i className="fa-solid fa-check mr-2"></i>
                                    Serve {readyItems.length} Ready Item{readyItems.length > 1 ? 's' : ''}
                                </button>
                            ) : servedItems.length > 0 && preparingItems.length === 0 ? (
                                <button
                                    onClick={() => handleMarkComplete(order._id)}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all duration-300 active:scale-95 hover:shadow-xl"
                                >
                                    <i className="fa-solid fa-flag-checkered mr-2"></i>
                                    Mark as Complete
                                </button>
                            ) : (
                                <div className="text-center py-2 text-gray-500 text-sm">
                                    <i className="fa-solid fa-clock mr-2"></i>
                                    Waiting for more items...
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
