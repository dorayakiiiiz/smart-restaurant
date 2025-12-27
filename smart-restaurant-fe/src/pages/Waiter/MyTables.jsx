import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { waiterService } from "../../services/waiterService";

export default function MyTables() {
    const { reloadTrigger } = useOutletContext();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTables();
    }, [reloadTrigger]);

    const loadTables = async () => {
        try {
            setLoading(true);
            const response = await waiterService.getTables();
            setSessions(response.data.sessions || []);
        } catch (error) {
            console.error('Error loading tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (sessionId) => {
        if (!confirm('Confirm payment for this table?')) return;
        
        try {
            await waiterService.confirmPayment(sessionId);
            loadTables();
        } catch (error) {
            console.error('Error confirming payment:', error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                    <p className="text-gray-500">Loading tables...</p>
                </div>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🪑</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No active tables</h3>
                <p className="text-gray-500">All tables are free</p>
            </div>
        );
    }

    return (
        <>
            {sessions.map(session => {
                const stats = session.orderStats;
                const hasActivity = stats && stats.totalOrders > 0;
                const isPaymentRequested = session.status === 'payment_requested';
                
                return (
                    <div 
                        key={session._id} 
                        className={`bg-white rounded-2xl mb-4 overflow-hidden shadow-md border-2 transition-all hover:shadow-xl ${
                            isPaymentRequested 
                                ? 'border-red-300 animate-pulse-slow' 
                                : 'border-indigo-100'
                        }`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center border-b-2 ${
                            isPaymentRequested 
                                ? 'bg-gradient-to-r from-red-50 to-white border-red-100' 
                                : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={`px-4 py-2.5 rounded-xl font-bold text-white shadow-lg ${
                                        isPaymentRequested 
                                            ? 'bg-gradient-to-br from-red-600 to-red-700' 
                                            : 'bg-gradient-to-br from-indigo-600 to-indigo-700'
                                    }`}>
                                        {session.tableId?.name || 'N/A'}
                                    </div>
                                    {isPaymentRequested && (
                                        <>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-gray-800">
                                        {isPaymentRequested ? (
                                            <span className="flex items-center gap-1">
                                                <i className="fa-solid fa-credit-card text-red-600"></i>
                                                Payment Requested
                                            </span>
                                        ) : (
                                            'Active Session'
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <i className="fa-solid fa-clock mr-1"></i>
                                        {getDuration(session.startTime)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                                    isPaymentRequested
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse'
                                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                                }`}>
                                    {isPaymentRequested ? (
                                        <><i className="fa-solid fa-bell mr-1"></i>PAYMENT</>
                                    ) : (
                                        <><i className="fa-solid fa-circle mr-1"></i>ACTIVE</>
                                    )}
                                </span>
                                <div className="text-[10px] text-gray-500 mt-1.5 font-medium">
                                    {new Date(session.startTime).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        {/* Order Stats */}
                        {hasActivity && (
                            <div className="p-4 bg-white border-b border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-semibold text-gray-700">
                                        <i className="fa-solid fa-receipt mr-2 text-indigo-600"></i>
                                        Total Orders: <span className="text-indigo-600">{stats.totalOrders}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-700">
                                        <i className="fa-solid fa-utensils mr-2 text-indigo-600"></i>
                                        Items: <span className="text-indigo-600">{stats.totalItems}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                    {getItemsStatusText(stats)}
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        ${session.totalAmount?.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm ${
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
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                            {isPaymentRequested ? (
                                <button
                                    onClick={() => handleConfirmPayment(session._id)}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                                >
                                    <i className="fa-solid fa-check-double mr-2"></i>
                                    Confirm Payment Received
                                </button>
                            ) : (
                                <div className="text-center py-3 text-sm text-gray-500 font-medium">
                                    <i className="fa-solid fa-hourglass-half mr-2"></i>
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
