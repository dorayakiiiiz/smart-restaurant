import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function MyTables() {
    const { reloadTrigger, setCounts } = useOutletContext();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState({});

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
        loadTables();
    }, [reloadTrigger]);

    const loadTables = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getTables();
            const sessionsList = response.data.sessions || [];
            setSessions(sessionsList);
            // Update count in parent
            if (setCounts) {
                setCounts(prev => ({ ...prev, tables: sessionsList.length }));
            }
        } catch (error) {
            // Error loading tables
        } finally {
            setLoading(false);
        }
    };

    const loadSessionOrders = async (sessionId) => {
        if (sessionOrders[sessionId]) return; // Already loaded
        
        try {
            const response = await waiterService.getSessionOrders(sessionId);
            setSessionOrders(prev => ({
                ...prev,
                [sessionId]: response.data.orders || []
            }));
        } catch (error) {
            // Error loading session orders
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

    const handleConfirmPayment = async (sessionId) => {
        if (!confirm('Confirm payment for this table?')) return;
        
        try {
            await waiterService.confirmPayment(sessionId);
            loadTables();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to confirm payment');
        }
    };

    const getDuration = (startTime) => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000 / 60);
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const getItemsStatusText = (stats) => {
        if (!stats) return 'No orders';
        
        const parts = [];
        if (stats.itemsServed > 0) parts.push(`${stats.itemsServed} served`);
        if (stats.itemsReady > 0) parts.push(`${stats.itemsReady} ready`);
        if (stats.itemsPreparing > 0) parts.push(`${stats.itemsPreparing} in kitchen`);
        if (stats.itemsPending > 0) parts.push(`${stats.itemsPending} pending`);
        
        return parts.length > 0 ? parts.join(', ') : 'No items';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: 'fa-clock' },
            'accepted': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Kitchen', icon: 'fa-fire' },
            'ready': { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready', icon: 'fa-check' },
            'served': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Served', icon: 'fa-check-double' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: 'fa-xmark' }
        };
        const badge = badges[status] || badges['pending'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <i className={`fa-solid ${badge.icon} mr-1`}></i>
                {badge.label}
            </span>
        );
    };

    // Calculate summary stats
    const calculateSummaryStats = () => {
        let totalTables = sessions.length;
        let totalAmount = 0;
        let paymentRequested = 0;

        sessions.forEach(session => {
            totalAmount += session.totalAmount || 0;
            if (session.status === 'payment_requested') {
                paymentRequested++;
            }
        });

        return { totalTables, totalAmount, paymentRequested };
    };

    const summaryStats = calculateSummaryStats();

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
            <div className="text-center py-20">
                <div className="text-6xl mb-4 animate-bounce">🪑</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No active tables</h3>
                <p className="text-gray-500">All tables are free</p>
            </div>
        );
    }

    return (
        <>
            {/* Summary Card with Tailwind animations */}
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
                        className={`bg-white rounded-xl mb-4 overflow-hidden shadow-sm border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            isPaymentRequested 
                                ? 'border-red-300 animate-pulse' 
                                : 'border-gray-200'
                        }`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center border-b ${
                            isPaymentRequested 
                                ? 'bg-red-50 border-red-100' 
                                : 'bg-gray-50 border-gray-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-lg font-bold text-white group-hover:scale-105 transition-transform duration-300 shadow-md ${
                                    isPaymentRequested 
                                        ? 'bg-red-600' 
                                        : 'bg-[#1a1a1a]'
                                }`}>
                                    {session.tableId?.name || 'N/A'}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        {isPaymentRequested ? (
                                            <span className="flex items-center gap-1">
                                                <i className="fa-solid fa-credit-card text-red-600 animate-pulse"></i>
                                                Payment Requested
                                            </span>
                                        ) : (
                                            'Active Session'
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <i className="fa-solid fa-clock"></i>
                                        {getDuration(session.startTime)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                                    isPaymentRequested
                                        ? 'bg-red-100 text-red-700 animate-pulse'
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {isPaymentRequested ? (
                                        <><i className="fa-solid fa-bell"></i>PAYMENT</>
                                    ) : (
                                        <><span className="inline-flex h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse"></span>ACTIVE</>
                                    )}
                                </span>
                                <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                    {formatDateTime(session.startTime)}
                                </div>
                            </div>
                        </div>

                        {/* Order Stats */}
                        {hasActivity && (
                            <div className="p-4 bg-white border-b border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-semibold text-gray-700">
                                        <i className="fa-solid fa-receipt mr-2 text-gray-600"></i>
                                        Total Orders: <span className="text-[#D4AF37]">{stats.totalOrders}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-700">
                                        <i className="fa-solid fa-utensils mr-2 text-gray-600"></i>
                                        Items: <span className="text-[#D4AF37]">{stats.totalItems}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg mb-2">
                                    {getItemsStatusText(stats)}
                                </div>
                                
                                {/* Toggle Orders Button */}
                                <button
                                    onClick={() => toggleExpand(session._id)}
                                    className="w-full py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} transition-transform duration-300`}></i>
                                    {isExpanded ? 'Hide' : 'View'} Order Details
                                </button>
                            </div>
                        )}

                        {/* Orders List (Expandable) */}
                        {isExpanded && orders.length > 0 && (
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    <i className="fa-solid fa-list mr-2"></i>
                                    Order History ({orders.length})
                                </div>
                                <div className="space-y-3">
                                    {orders.map((order, idx) => (
                                        <div key={order._id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-xs text-gray-800">
                                                        Order #{idx + 1} • #{order._id.slice(-6)}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                        {formatDateTime(order.createdAt)}
                                                    </div>
                                                </div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                <i className="fa-solid fa-utensils mr-1 text-gray-400"></i>
                                                {order.items?.length || 0} items
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="p-4 bg-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        ${session.totalAmount?.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                                        session.paymentStatus === 'paid' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {session.paymentStatus === 'paid' ? (
                                            <><i className="fa-solid fa-check-circle mr-1"></i>Paid</>
                                        ) : (
                                            <><i className="fa-solid fa-clock mr-1"></i>Unpaid</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="p-4 bg-gray-50">
                            {isPaymentRequested ? (
                                <button
                                    onClick={() => handleConfirmPayment(session._id)}
                                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all duration-300 active:scale-95 hover:shadow-xl"
                                >
                                    <i className="fa-solid fa-check-double mr-2"></i>
                                    Confirm Payment Received
                                </button>
                            ) : (
                                <div className="text-center py-3 text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-hourglass-half animate-pulse"></i>
                                    Waiting for customer...
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
