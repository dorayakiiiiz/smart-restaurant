import { formatDateTime } from '../../../../utils/helper';
import StatusBadge from './StatusBadge';

// ============ ACTION BUTTONS COMPONENT ============
const ActionButtons = ({ order, onReject, onAccept, onServe, onViewDetail }) => {
    const viewBtn = (
        <button 
            onClick={() => onViewDetail(order)} 
            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
            {['served', 'completed', 'rejected'].includes(order.status) ? 'View Detail' : 'View'}
        </button>
    );
    
    const actions = {
        pending: [
            <button 
                key="reject" 
                onClick={() => onReject(order)} 
                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
                Reject
            </button>,
            <button 
                key="accept" 
                onClick={() => onAccept(order._id)} 
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] transition"
            >
                Accept
            </button>,
            viewBtn
        ],
        ready: [
            <button 
                key="serve" 
                onClick={() => onServe(order._id)} 
                className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
                Serve
            </button>,
            viewBtn
        ],
        preparing: [
            <div key="preparing" className="flex items-center gap-2">
                <span className="text-xs text-gray-500 italic whitespace-nowrap">Kitchen preparing...</span>
                {viewBtn}
            </div>
        ],
        accepted: [
            <div key="accepted" className="flex items-center gap-2">
                <span className="text-xs text-gray-500 italic whitespace-nowrap">Kitchen preparing...</span>
                {viewBtn}
            </div>
        ]
    };
    
    return <div className="flex gap-2 items-center">{actions[order.status] || viewBtn}</div>;
};

// ============ ORDER ROW COMPONENT ============
export default function OrderRow({ order, onViewDetail, onReject, onAccept, onServe }) {
    const isNew = (Date.now() - new Date(order.createdAt)) < 60000;
    const totalPrice = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    
    // Check if order is completed and has discount
    const isCompleted = ['served', 'completed'].includes(order.status);
    const session = order.sessionId;
    const hasDiscount = isCompleted && session?.discountPercentage > 0;
    const displayPrice = hasDiscount ? session.finalAmount : totalPrice;
    
    return (
        <tr className={`hover:bg-gray-50 transition ${isNew ? 'bg-orange-50' : ''}`}>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">
                            #{order._id.slice(-6)}
                        </span>
                        {isNew && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                                NEW
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="font-semibold text-sm text-gray-800">
                    {order.sessionId?.tableId?.name || 'N/A'}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="text-sm text-gray-600 space-y-1">
                    {order.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx}>{item.quantity}x {item.name}</div>
                    ))}
                    {order.items?.length > 2 && (
                        <div className="text-xs text-blue-600 font-semibold">
                            +{order.items.length - 2} more
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                    <span className="font-bold text-sm text-gray-800">
                        ${displayPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                        <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                            -{session.discountPercentage}%
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-4">
                <span className="text-xs text-gray-500">
                    {formatDateTime(order.createdAt)}
                </span>
            </td>
            <td className="px-4 py-4">
                <ActionButtons 
                    order={order} 
                    onReject={onReject} 
                    onAccept={onAccept} 
                    onServe={onServe} 
                    onViewDetail={onViewDetail} 
                />
            </td>
        </tr>
    );
}
