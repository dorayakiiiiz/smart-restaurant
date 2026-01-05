import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waiterService } from "../../services/waiterService";

export default function MyTables() {
    const { setCounts } = useOutletContext();
    const queryClient = useQueryClient();
    
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState({});

    // Fetch tables using React Query
    const { data: sessions = [], isLoading: loading } = useQuery({
        queryKey: ['waiter-tables'],
        queryFn: async () => {
            const res = await waiterService.getTables();
            return res.data.sessions || [];
        }
    });

    
    // Helper functions (Đã bổ sung để fix lỗi ReferenceError)
    const getDuration = (startTime) => {
        if (!startTime) return '0m';
        const start = new Date(startTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 60000); // minutes
        if (diff < 60) return `${diff}m`;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m}m`;
    };

    const getItemsStatusText = (session) => {
        if (!session.orderStats) return "No orders";
        const { pending, accepted, ready, served } = session.orderStats;
        if (ready > 0) return `${ready} ready to serve`;
        if (accepted > 0) return `${accepted} cooking`;
        if (pending > 0) return `${pending} pending`;
        return `${served} served`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">Active</span>;
            case 'payment_requested': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold animate-pulse">Payment</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{status}</span>;
        }
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Mutation for payment
    const paymentMutation = useMutation({
        mutationFn: (sessionId) => waiterService.confirmPayment(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waiter-tables'] });
        }
    });

    const handleConfirmPayment = (sessionId) => {
        if (window.confirm("Confirm payment received and clear table?")) {
            paymentMutation.mutate(sessionId);
        }
    };

    // Load session orders
    const loadSessionOrders = async (sessionId) => {
        if (sessionOrders[sessionId]) return;
        try {
            const res = await waiterService.getSessionOrders(sessionId);
            setSessionOrders(prev => ({ ...prev, [sessionId]: res.data.orders }));
        } catch (error) {
            console.error("Error loading session orders:", error);
        }
    };

    const toggleExpand = (sessionId) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
            loadSessionOrders(sessionId);
        }
    };

    // Calculate summary stats
    const calculateSummaryStats = () => {
        let totalTables = sessions.length;
        let totalAmount = 0;
        let paymentRequested = 0;

        sessions.forEach(session => {
            totalAmount += session.totalAmount || 0;
            if (session.status === 'payment_requested') paymentRequested++;
        });

        return { totalTables, totalAmount, paymentRequested };
    };

    const summaryStats = calculateSummaryStats();

    useEffect(() => {
        setCounts(prev => ({ ...prev, tables: sessions.length }));
    }, [sessions.length, setCounts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-[#1a1a1a] mb-4"></i>
                    <p className="text-gray-500">Loading tables...</p>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-fade-in">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <i className="fa-solid fa-chair text-4xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-600">No active tables</h3>
                <p className="text-sm">You are all caught up!</p>
            </div>
        );
    }

    // Render Status Badge & Action Button
    const renderTableAction = (session) => {
        if (session.status === 'payment_requested') {
            
            // CASE 1: Tiền mặt (Giữ nguyên)
            if (session.paymentMethod === 'cash') {
                return (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            handleConfirmPayment(session._id);
                        }}
                        disabled={paymentMutation.isPending}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <i className="fa-solid fa-money-bill-wave"></i>
                        Confirm Cash
                    </button>
                );
            } 
            // CASE 2: Chuyển khoản (PayOS)
            else if (session.paymentMethod === 'transfer') {
                
                // 👇 SỬA Ở ĐÂY: Check thêm paymentStatus xem đã Paid chưa
                if (session.paymentStatus === 'paid') {
                    return (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmPayment(session._id);
                            }}
                            disabled={paymentMutation.isPending}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 animate-bounce-in"
                        >
                            <i className="fa-solid fa-check-double"></i>
                            Paid! Clear Table
                        </button>
                    );
                }

                // Nếu chưa Paid thì mới hiện "QR Paying..."
                return (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                        <i className="fa-solid fa-qrcode text-blue-600 animate-pulse text-xs"></i>
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">QR Paying...</span>
                    </div>
                );
            }
        }
        
        return (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                Active
            </span>
        );
    };
    return (
        <>
            {/* Summary Card */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center group">
                        <i className="fa-solid fa-chair text-gray-600 text-2xl group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                            Active Tables
                            {sessions.length > 0 && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-gray-500 animate-pulse"></span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-sm">{summaryStats.totalTables}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#D4AF37] transition-colors">Tables</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <span className="text-white font-bold text-[10px]">${summaryStats.totalAmount.toFixed(0)}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-500 transition-colors">Total</span>
                            </div>
                            {summaryStats.paymentRequested > 0 && (
                                <div className="flex items-center gap-2 col-span-2 animate-pulse">
                                    <i className="fa-solid fa-bell text-red-500"></i>
                                    <span className="text-xs font-semibold text-red-600">
                                        {summaryStats.paymentRequested} table{summaryStats.paymentRequested > 1 ? 's' : ''} requesting payment
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {sessions.map(session => {
                const stats = session.orderStats;
                const hasActivity = stats && stats.totalOrders > 0;
                const isPaymentRequested = session.status === 'payment_requested';
                const isExpanded = expandedSession === session._id;
                const orders = sessionOrders[session._id] || [];

                return (
                    <div 
                        key={session._id} 
                        className={`bg-white rounded-xl mb-4 shadow-sm border transition-all duration-300 overflow-hidden ${
                            isPaymentRequested ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200'
                        }`}
                    >
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition"
                            onClick={() => toggleExpand(session._id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                                        isPaymentRequested ? 'bg-orange-100 text-orange-600' : 'bg-gray-800 text-[#D4AF37]'
                                    }`}>
                                        {session.tableId?.name?.replace('Table ', '') || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 flex items-center gap-2">
                                            {session.tableId?.name}
                                            {renderTableAction(session)}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                            <i className="fa-regular fa-clock"></i> {getDuration(session.startTime)}
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className={hasActivity ? "text-blue-600 font-semibold" : ""}>
                                                {getItemsStatusText(session)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-gray-800">${session.totalAmount?.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">Total</div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50 p-4 animate-fade-in">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Order History</h4>
                                {orders.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">No orders yet</div>
                                ) : (
                                    <div className="space-y-3">
                                        {orders.map(order => (
                                            <div key={order._id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                                                    <span className="text-xs font-bold text-gray-500">#{order._id.slice(-4)}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                        order.status === 'served' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>{order.status}</span>
                                                </div>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm py-0.5">
                                                        <span className="text-gray-700">
                                                            <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                                                        </span>
                                                        <span className="text-gray-500">${(item.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                            
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
}
