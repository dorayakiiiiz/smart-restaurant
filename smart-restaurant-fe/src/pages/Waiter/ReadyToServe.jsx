import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ReadyToServe() {
    const { setCounts } = useOutletContext();
    const queryClient = useQueryClient();

     // Thay thế useEffect/loadOrders bằng useQuery
    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['waiter-orders', 'ready'],
        queryFn: async () => {
            const res = await waiterService.getReadyOrders();
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

    // Mutations
    const serveMutation = useMutation({
        mutationFn: (orderId) => waiterService.markAsServed(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
        }
    });

    const completeMutation = useMutation({
        mutationFn: (orderId) => waiterService.markOrderComplete(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waiter-orders'] });
        }
    });

    const handleMarkServed = (orderId) => {
        serveMutation.mutate(orderId);
    };

    const handleMarkComplete = (orderId) => {
        completeMutation.mutate(orderId);
    };

    

    // Calculate summary stats - đếm items theo status
    const calculateStats = () => {
        let waitingItems = 0;
        let preparingItems = 0;
        let readyItems = 0;
        let servedItems = 0;
        let totalOrders = orders.length;

        orders.forEach(order => {
            order.items?.forEach(item => {
                if (['pending', 'confirmed'].includes(item.status)) {
                    waitingItems += item.quantity;
                } else if (item.status === 'preparing') {
                    preparingItems += item.quantity;
                } else if (item.status === 'ready') {
                    readyItems += item.quantity;
                } else if (item.status === 'served') {
                    servedItems += item.quantity;
                }
            });
        });

        return { waitingItems, preparingItems, readyItems, servedItems, totalOrders };
    };

    const stats = calculateStats();

    useEffect(() => {
        setCounts(prev => ({ ...prev, ready: orders.length }));
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
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-fade-in">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <i className="fa-solid fa-bell-concierge text-4xl text-gray-300"></i>
                </div>
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
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center group">
                        <i className="fa-solid fa-utensils text-blue-600 text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"></i>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                            Kitchen Status
                            {orders.length > 0 && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.preparingItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-orange-500 transition-colors">Cooking</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.readyItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-green-500 transition-colors">Ready</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{stats.servedItems}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-500 transition-colors">Served</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            <i className="fa-solid fa-clipboard-list mr-1"></i>
                            {stats.totalOrders} active order{stats.totalOrders !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {orders.map(order => {
                // Hiển thị TẤT CẢ items (preparing + ready + served)
                const preparingItems = order.items?.filter(item => item.status === 'preparing') || [];
                const readyItems = order.items?.filter(item => item.status === 'ready') || [];
                const servedItems = order.items?.filter(item => item.status === 'served') || [];
                const allItems = [...preparingItems, ...readyItems, ...servedItems];
                
                if (allItems.length === 0) return null;
                return (
                    <div key={order._id} className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm border-2 border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                                        {preparingItems.length} cooking • {readyItems.length} ready • {servedItems.length} served
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 font-medium">
                                    {formatDateTime(order.createdAt)}
                                </div>
                            </div>
                        </div>

                        {/* Items - Hiển thị preparing + ready + served */}
                        <div className="p-4 bg-white">
                            {allItems.map((item, idx) => {
                                const isPreparing = item.status === 'preparing';
                                const isReady = item.status === 'ready';
                                const isServed = item.status === 'served';
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex justify-between items-start py-3 border-b border-gray-100 last:border-0 transition-colors duration-200 rounded-lg px-2 -mx-2 group ${
                                            isServed ? 'opacity-40' : isPreparing ? 'hover:bg-orange-50' : 'hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="flex gap-3 flex-1 items-center">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold min-w-[45px] text-center transition-all duration-300 shadow-sm ${
                                                isServed 
                                                    ? 'bg-gray-200 text-gray-500' 
                                                    : isPreparing
                                                    ? 'bg-orange-100 text-orange-700 group-hover:scale-110'
                                                    : 'bg-green-100 text-green-700 group-hover:scale-110'
                                            }`}>
                                                {item.quantity}x
                                            </span>
                                            <div className="flex-1">
                                                <div className={`font-semibold text-sm flex items-center gap-2 transition-colors ${
                                                    isServed ? 'text-gray-500 line-through' : 'text-gray-800'
                                                }`}>
                                                    {item.name}
                                                    {isPreparing && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                                            <i className="fa-solid fa-fire text-[8px] animate-pulse"></i>
                                                            COOKING
                                                        </span>
                                                    )}
                                                    {isReady && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                                                            <i className="fa-solid fa-check text-[8px]"></i>
                                                            READY
                                                        </span>
                                                    )}
                                                    {isServed && (
                                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                                            <i className="fa-solid fa-check text-[8px]"></i>
                                                            SERVED
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
                                                        isServed ? 'text-gray-400 bg-gray-100' : isPreparing ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
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
                                <div className="text-center py-2 text-gray-500 text-sm flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-fire animate-pulse text-orange-500"></i>
                                    <span>Kitchen is preparing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
