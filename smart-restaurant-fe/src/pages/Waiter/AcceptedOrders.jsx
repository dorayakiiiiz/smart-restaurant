import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function AcceptedOrders() {
    const { setCounts } = useOutletContext();

    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['waiter-orders', 'accepted'],
        queryFn: async () => {
            const res = await waiterService.getAcceptedOrders();
            return res.data.orders || [];
        }
    });

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

    // Calculate summary stats
    const calculateStats = () => {
        let totalItems = 0;
        let preparing = 0;
        let ready = 0;
        let pending = 0;

        orders.forEach(order => {
            order.items?.forEach(item => {
                totalItems += item.quantity;
                
                if (item.status === 'preparing') {
                    preparing += item.quantity;
                } else if (item.status === 'ready') {
                    ready += item.quantity;
                } else if (item.status === 'pending' || item.status === 'confirmed') {
                    pending += item.quantity;
                }
            });
        });

        return { totalItems, preparing, ready, pending };
    };

    const stats = calculateStats();

    useEffect(() => {
        setCounts(prev => ({ ...prev, accepted: orders.length }));
    }, [orders.length, setCounts]);

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
                <div className="text-6xl mb-4 animate-bounce">👨‍🍳</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Kitchen is clear!</h3>
                <p className="text-gray-500">No orders in preparation</p>
            </div>
        );
    }

    return (
        <>
            {/* Summary Card with Tailwind animations */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center group">
                        <i className="fa-solid fa-fire-burner text-blue-600 text-2xl group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                            Kitchen Status
                            {orders.length > 0 && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
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
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.totalItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-500 transition-colors">Items</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2 animate-pulse">
                                <i className="fa-solid fa-fire text-blue-600"></i>
                                <span className="text-xs font-semibold text-gray-700">Kitchen is working on these orders</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {orders.map(order => {
                // Chỉ hiển thị items chưa bắt đầu nấu (pending/confirmed)
                const pendingItems = order.items?.filter(item => 
                    item.status === 'pending' || item.status === 'confirmed'
                ) || [];
                
                // Nếu không có item pending thì không hiển thị order này
                if (pendingItems.length === 0) return null;
                
                return (
                <div key={order._id} className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-bold group-hover:scale-105 transition-transform duration-300 shadow-md">
                                {order.sessionId?.tableId?.name || 'N/A'}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                    #{order._id.slice(-6)}
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <i className="fa-solid fa-utensils text-[10px]"></i>
                                    {pendingItems.length} waiting
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                IN KITCHEN
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                {formatDateTime(order.createdAt)}
                            </div>
                        </div>
                    </div>

                    {/* Items - Chỉ hiển thị pending */}
                    <div className="p-4 bg-white">
                        {pendingItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors duration-200 rounded-lg px-2 -mx-2 group">
                                <div className="flex gap-3 flex-1 items-center">
                                    <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold min-w-[45px] text-center group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300 shadow-sm">
                                        {item.quantity}x
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">{item.name}</div>
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
                                            <div className="text-xs text-orange-600 italic mt-1.5 bg-orange-50 px-2 py-1 rounded">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {item.note}
                                            </div>
                                        )}
                                        {/* Status badge */}
                                        <div className="mt-2">
                                            <span className="text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1 bg-yellow-100 text-yellow-700">
                                                <i className="fa-solid fa-clock"></i>
                                                WAITING
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-gray-800 ml-2 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-gray-50 text-center">
                        <p className="text-sm text-blue-700 font-medium flex items-center justify-center gap-2">
                            <i className="fa-solid fa-clock animate-pulse"></i>
                            Waiting for kitchen to start
                        </p>
                    </div>
                </div>
                );
            })}
        </>
    );
}
