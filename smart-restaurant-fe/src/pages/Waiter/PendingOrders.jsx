import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function PendingOrders() {
    const { reloadTrigger } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        loadOrders();
    }, [reloadTrigger]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getPendingOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error loading pending orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (orderId) => {
        try {
            await waiterService.acceptOrder(orderId);
            loadOrders();
        } catch (error) {
            console.error('Error accepting order:', error);
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
            console.error('Error rejecting order:', error);
            alert('Failed to reject order');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h3>
                <p className="text-gray-500">No pending orders at the moment</p>
            </div>
        );
    }

    return (
        <>
            {orders.map(order => {
                const isNew = (Date.now() - new Date(order.createdAt)) < 60000; // New if < 1 min
                
                return (
                    <div 
                        key={order._id} 
                        className={`bg-white rounded-2xl mb-4 overflow-hidden shadow-md border-2 transition-all hover:shadow-xl ${
                            isNew ? 'border-orange-400 animate-pulse-slow' : 'border-gray-100'
                        }`}
                    >
                        {/* Header - Enhanced */}
                        <div className="p-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg">
                                        {order.sessionId?.tableId?.name || 'N/A'}
                                    </div>
                                    {isNew && (
                                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                                            NEW
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800">#{order._id.slice(-6)}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <i className="fa-solid fa-utensils text-[10px]"></i>
                                        {order.items?.length || 0} items
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-md">
                                    PENDING
                                </span>
                                <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        {/* Items - Enhanced */}
                        <div className="p-4 bg-white">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start py-3 border-b border-dashed border-gray-200 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition">
                                    <div className="flex gap-3 flex-1">
                                        <span className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm min-w-[45px] text-center">
                                            {item.quantity}x
                                        </span>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                                            {item.modifiers?.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                                                    {item.modifiers.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <i className="fa-solid fa-circle text-[4px] text-purple-400"></i>
                                                            <span>{m.name}: {m.option}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {item.note && (
                                                <div className="text-xs text-orange-600 italic mt-1.5 bg-orange-50 px-2 py-1 rounded inline-block">
                                                    <i className="fa-solid fa-note-sticky mr-1"></i>
                                                    {item.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-800 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions - Enhanced */}
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 flex gap-3">
                            <button
                                onClick={() => handleRejectClick(order)}
                                className="flex-1 py-3.5 border-2 border-red-500 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <i className="fa-solid fa-xmark mr-2"></i>
                                Reject
                            </button>
                            <button
                                onClick={() => handleAccept(order._id)}
                                className="flex-[2] py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                            >
                                <i className="fa-solid fa-check mr-2"></i>
                                Accept & Send to Kitchen
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Reject Modal - Enhanced */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slideUp">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <i className="fa-solid fa-xmark text-red-600 text-xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Reject Order</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting this order:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 mb-4 h-24 resize-none outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                            placeholder="e.g., Out of stock, Kitchen closed..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                    setSelectedOrder(null);
                                }}
                                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition active:scale-95"
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
