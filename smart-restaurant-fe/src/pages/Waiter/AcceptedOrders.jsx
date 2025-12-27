import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function AcceptedOrders() {
    const { reloadTrigger } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, [reloadTrigger]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getAcceptedOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error loading accepted orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">👨‍🍳</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Kitchen is clear!</h3>
                <p className="text-gray-500">No orders in preparation</p>
            </div>
        );
    }

    return (
        <>
            {orders.map(order => (
                <div key={order._id} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-md border-2 border-blue-100 transition-all hover:shadow-xl">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white border-b-2 border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg">
                                {order.sessionId?.tableId?.name || 'N/A'}
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
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold shadow-md">
                                <i className="fa-solid fa-fire mr-1"></i>
                                IN KITCHEN
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-4 bg-white">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start py-3 border-b border-dashed border-gray-200 last:border-0 hover:bg-blue-50 rounded-lg px-2 transition">
                                <div className="flex gap-3 flex-1">
                                    <span className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm min-w-[45px] text-center">
                                        {item.quantity}x
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                                        {item.modifiers?.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                                                {item.modifiers.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <i className="fa-solid fa-circle text-[4px] text-blue-400"></i>
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
                                        {/* Status badge */}
                                        <div className="mt-2">
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                item.status === 'preparing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                                item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.status === 'preparing' && <i className="fa-solid fa-fire mr-1"></i>}
                                                {item.status === 'ready' && <i className="fa-solid fa-check mr-1"></i>}
                                                {item.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-gray-800 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white text-center">
                        <p className="text-sm text-blue-700 font-medium">
                            <i className="fa-solid fa-clock mr-2"></i>
                            Kitchen is preparing this order
                        </p>
                    </div>
                </div>
            ))}
        </>
    );
}
