import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function PendingOrders() {
    const { reloadTrigger, setCounts } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

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
            const response = await waiterService.getPendingOrders();
            const ordersList = response.data.orders || [];
            setOrders(ordersList);
            if (setCounts) {
                setCounts(prev => ({ ...prev, pending: ordersList.length }));
            }
        } catch (error) {
            // Error loading pending orders
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (orderId) => {
        try {
            await waiterService.acceptOrder(orderId);
            loadOrders();
        } catch (error) {
            alert('Failed to accept order');
        }
    };

    const handleRejectClick = (order) => {
        setSelectedOrder(order);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        try {
            await waiterService.rejectOrder(selectedOrder._id, rejectionReason);
            setShowRejectModal(false);
            setRejectionReason("");
            setSelectedOrder(null);
            loadOrders();
        } catch (error) {
            alert('Failed to reject order');
        }
    };

    // Calculate summary stats
    const calculateStats = () => {
        let totalItems = 0;
        let oldestTime = null;

        orders.forEach(order => {
            order.items?.forEach(item => {
                totalItems += item.quantity;
            });
            
            const orderTime = new Date(order.createdAt);
            if (!oldestTime || orderTime < oldestTime) {
                oldestTime = orderTime;
            }
        });

        const oldestMinutes = oldestTime 
            ? Math.floor((Date.now() - oldestTime.getTime()) / 1000 / 60)
            : 0;

        return { totalItems, oldestMinutes };
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
                <div className="text-6xl mb-4 animate-bounce">✓</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h3>
                <p className="text-gray-500">No pending orders at the moment</p>
            </div>
        );
    }

    return (
        <>
            {/* Summary Card with Tailwind animations */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center group">
                        <i className="fa-solid fa-clock-rotate-left text-orange-600 text-2xl group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                            Pending Orders Summary
                            {orders.length > 0 && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{orders.length}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#D4AF37] transition-colors">Orders</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.totalItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-orange-500 transition-colors">Items</span>
                            </div>
                            {stats.oldestMinutes > 0 && (
                                <div className="flex items-center gap-2 col-span-2 animate-pulse">
                                    <i className="fa-solid fa-hourglass-half text-orange-600"></i>
                                    <span className="text-xs font-medium text-gray-600">
                                        Oldest: <span className="font-bold text-orange-600">{stats.oldestMinutes}m</span> ago
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {orders.map(order => {
                const isNew = (Date.now() - new Date(order.createdAt)) < 60000;
                
                return (
                    <div 
                        key={order._id} 
                        className={`bg-white rounded-xl mb-4 overflow-hidden shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            isNew ? 'border-orange-400' : 'border-gray-200'
                        }`}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <div className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-bold group-hover:scale-105 transition-transform duration-300 shadow-md">
                                        {order.sessionId?.tableId?.name || 'N/A'}
                                    </div>
                                    {isNew && (
                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                                            NEW
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        #{order._id.slice(-6)}
                                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <i className="fa-solid fa-utensils text-[10px]"></i>
                                        {order.items?.length || 0} items
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    PENDING
                                </span>
                                <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                    {formatDateTime(order.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-4 bg-white">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0 hover:bg-orange-50 transition-colors duration-200 rounded-lg px-2 -mx-2 group">
                                    <div className="flex gap-3 flex-1 items-center">
                                        <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold min-w-[45px] text-center group-hover:scale-110 group-hover:bg-orange-100 group-hover:text-orange-700 transition-all duration-300 shadow-sm">
                                            {item.quantity}x
                                        </span>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm text-gray-800 group-hover:text-orange-700 transition-colors">{item.name}</div>
                                            {item.modifiers?.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                                                    {item.modifiers.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <i className="fa-solid fa-circle text-[4px] text-gray-400"></i>
                                                            <span>{m.name}: {m.option}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {item.note && (
                                                <div className="text-xs text-orange-600 italic mt-1.5 bg-orange-50 px-2 py-1 rounded animate-pulse">
                                                    <i className="fa-solid fa-note-sticky mr-1"></i>
                                                    {item.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-800 ml-2 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => handleRejectClick(order)}
                                className="flex-1 py-3 border-2 border-red-500 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all duration-300 active:scale-95 hover:shadow-lg"
                            >
                                <i className="fa-solid fa-xmark mr-2"></i>
                                Reject
                            </button>
                            <button
                                onClick={() => handleAccept(order._id)}
                                className="flex-[2] py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-[#333] transition-all duration-300 active:scale-95 hover:shadow-xl"
                            >
                                <i className="fa-solid fa-check mr-2"></i>
                                Accept & Send to Kitchen
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
                        {/* Close button X */}
                        <button
                            onClick={() => {
                                setShowRejectModal(false);
                                setRejectionReason("");
                                setSelectedOrder(null);
                            }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 active:scale-95"
                        >
                            <i className="fa-solid fa-xmark text-gray-600"></i>
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Reject Order</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting this order:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 h-24 resize-none outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-yellow-100 transition-all duration-300 hover:border-gray-300"
                            placeholder="e.g., Out of stock, Kitchen closed..."
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                    setSelectedOrder(null);
                                }}
                                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all duration-300 active:scale-95 hover:shadow-lg"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
