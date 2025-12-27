import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function ReadyToServe() {
    const { reloadTrigger } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, [reloadTrigger]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getReadyOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error loading ready orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkServed = async (orderId) => {
        try {
            await waiterService.markAsServed(orderId);
            loadOrders();
        } catch (error) {
            console.error('Error marking as served:', error);
            alert('Failed to mark as served');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">All served!</h3>
                <p className="text-gray-500">No orders ready to serve</p>
            </div>
        );
    }

    return (
        <>
            {orders.map(order => (
                <div key={order._id} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-md border-2 border-green-200 transition-all hover:shadow-xl animate-pulse-slow">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-gradient-to-r from-green-50 to-white border-b-2 border-green-100">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg">
                                    {order.sessionId?.tableId?.name || 'N/A'}
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
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
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md animate-pulse">
                                <i className="fa-solid fa-check mr-1"></i>
                                READY
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-4 bg-white">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start py-3 border-b border-dashed border-gray-200 last:border-0 hover:bg-green-50 rounded-lg px-2 transition">
                                <div className="flex gap-3 flex-1">
                                    <span className="bg-gradient-to-br from-green-100 to-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm min-w-[45px] text-center">
                                        {item.quantity}x
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                                            {item.name}
                                            <i className="fa-solid fa-circle-check text-green-500 text-xs"></i>
                                        </div>
                                        {item.modifiers?.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                                                {item.modifiers.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <i className="fa-solid fa-circle text-[4px] text-green-400"></i>
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

                    {/* Action */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                        <button
                            onClick={() => handleMarkServed(order._id)}
                            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <i className="fa-solid fa-hand-holding-heart mr-2"></i>
                            Mark as Served
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}
