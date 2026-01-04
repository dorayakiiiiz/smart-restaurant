import React from 'react';
import { useNavigate } from 'react-router-dom';

// ============ HELPER FUNCTIONS (Copied from OrdersPage) ============
const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const STATUS_BADGES = {
    pending: { text: "Received", color: "bg-orange-100 text-orange-700", icon: "fa-clock" },
    accepted: { text: "Preparing", color: "bg-blue-100 text-blue-700", icon: "fa-fire" },
    preparing: { text: "Preparing", color: "bg-blue-100 text-blue-700", icon: "fa-fire" },
    ready: { text: "Ready", color: "bg-green-100 text-green-700", icon: "fa-check-circle" },
    completed: { text: "Completed", color: "bg-gray-100 text-gray-700", icon: "fa-check-double" },
    served: { text: "Completed", color: "bg-gray-100 text-gray-700", icon: "fa-check-double" },
    rejected: { text: "Rejected", color: "bg-red-100 text-red-700", icon: "fa-times-circle" },
};

// ============ SUB-COMPONENTS ============
const StatusBadge = ({ status }) => {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${badge.color}`}>
            <i className={`fa-solid ${badge.icon}`}></i>
            {badge.text}
        </span>
    );
};

const OrderRow = ({ order }) => {
    const isNew = (Date.now() - new Date(order.createdAt)) < 60000;
    const totalPrice = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    
    return (
        <tr className={`hover:bg-gray-50 transition ${isNew ? 'bg-orange-50' : ''} border-b border-gray-100 last:border-0`}>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        {/* Id order rút gọn */}
                        <span className="font-semibold text-sm text-gray-800">#{order._id.slice(-6)}</span>
                        {isNew && <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full animate-pulse">NEW</span>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4"><div className="font-semibold text-sm text-gray-800">{order.sessionId?.tableId?.name || 'N/A'}</div></td>
            <td className="px-4 py-4">
                <div className="text-sm text-gray-600 space-y-1">
                    {order.items?.slice(0, 2).map((item, idx) => <div key={idx}>{item.quantity}x items</div>)}
                    {order.items?.length > 2 && <div className="text-xs text-blue-600 font-semibold">+{order.items.length - 2} more</div>}
                </div>
            </td>
            <td className="px-4 py-4"><span className="font-bold text-sm text-gray-800">${totalPrice.toFixed(2)}</span></td>
            <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
            <td className="px-4 py-4"><span className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</span></td>
        </tr>
    );
};

export default function RecentOrdersTable({ orders = [], isLoading = false }) {
    const navigate = useNavigate();

    // Lấy 5 đơn hàng đầu tiên

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full">
          
            {isLoading ? (
                <div className="text-center py-10 text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading orders...
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No recent orders found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Table</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Items</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <OrderRow key={order._id} order={order} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="p-4 border-t border-gray-100">
                <button 
                    onClick={() => navigate('/system/admin/orders')}
                    className="w-full py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                    View All Orders
                </button>
            </div>
        </div>
    );
}