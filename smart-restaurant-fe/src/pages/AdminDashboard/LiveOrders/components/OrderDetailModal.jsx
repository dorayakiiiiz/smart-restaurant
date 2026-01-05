import { 
    formatTime, 
    calcDiffSeconds, 
    formatDuration, 
    getTimeStyle, 
    STEP_COLORS 
} from '../../../../utils/helper';
import StatusBadge from './StatusBadge';

// ============ SUB-COMPONENTS ============
const TimelineStep = ({ step, idx, isCompleted, nextStep }) => {
    const diffToNext = nextStep ? calcDiffSeconds(step.time, nextStep.time) : null;
    const colors = STEP_COLORS[step.key];
    
    return (
        <>
            <div className="flex flex-col items-center flex-shrink-0">
                <div className={`text-xs font-bold mb-2 h-5 ${isCompleted ? 'text-gray-700' : 'text-gray-300'}`}>
                    {isCompleted ? formatTime(step.time) : '--:--'}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isCompleted ? `${colors.bg} text-white` : `${colors.bgInactive} ${colors.textInactive} border-2 border-gray-200`}`}>
                    <i className={`fa-solid ${step.icon} text-sm`}></i>
                </div>
                <div className={`text-xs font-bold mt-2 whitespace-nowrap ${isCompleted ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>
                    {step.label}
                </div>
            </div>
            {idx < 3 && (
                <div className="flex flex-col items-center justify-center flex-1 px-4 pt-7">
                    <div className={`text-[10px] font-semibold mb-1 px-2 py-0.5 rounded-full whitespace-nowrap ${diffToNext !== null ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-300'}`}>
                        {diffToNext !== null ? formatDuration(diffToNext) : '--'}
                    </div>
                    <div className={`w-full h-0.5 ${isCompleted && nextStep?.time ? 'bg-gray-400' : 'bg-gray-200'}`}></div>
                </div>
            )}
        </>
    );
};

const StaffRow = ({ staff, role }) => {
    const roleConfig = {
        waiter: { bg: 'bg-blue-500', icon: 'fa-user', label: 'Waiter' },
        kitchen: { bg: 'bg-green-500', icon: 'fa-fire', label: 'Kitchen' },
        admin: { bg: 'bg-purple-500', icon: 'fa-user-shield', label: 'Admin' }
    };
    const config = roleConfig[role] || roleConfig.admin;
    
    return (
        <tr className="border-b border-gray-100 last:border-0">
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${config.bg} text-white flex items-center justify-center flex-shrink-0`}>
                        <i className={`fa-solid ${config.icon} text-xs`}></i>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{config.label}</span>
                </div>
            </td>
            <td className="py-3 px-4">
                <span className="text-sm font-bold text-[#1a1a1a]">{staff.fullName || '-'}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-sm text-gray-600">{staff.email || '-'}</span>
            </td>
        </tr>
    );
};

const MetricCard = ({ icon, label, value, description, bgClass, colorClass }) => (
    <div className={`rounded-xl p-4 ${bgClass}`}>
        <div className="flex items-center gap-2 mb-2">
            <i className={`fa-solid ${icon} text-sm ${colorClass}`}></i>
            <span className="text-xs font-semibold text-gray-600">{label}</span>
        </div>
        <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
        <div className="text-[10px] text-gray-400 mt-1">{description}</div>
    </div>
);

const OrderItem = ({ item }) => (
    <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{item.quantity}x {item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'served' ? 'bg-green-100 text-green-700' : 
                        item.status === 'ready' ? 'bg-blue-100 text-blue-700' : 
                        item.status === 'preparing' ? 'bg-orange-100 text-orange-700' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {item.status?.toUpperCase() || 'PENDING'}
                    </span>
                </div>
                {item.modifiers?.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                        {item.modifiers.map((mod, i) => (
                            <span key={i} className="mr-2">+ {mod.name}</span>
                        ))}
                    </div>
                )}
                {item.note && (
                    <div className="mt-1 text-xs text-orange-600 italic">
                        <i className="fa-solid fa-note-sticky mr-1"></i>{item.note}
                    </div>
                )}
            </div>
            <span className="font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    </div>
);

// ============ SECTION COMPONENTS ============
const OrderTimeline = ({ timelineSteps }) => (
    <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Order Timeline</h3>
        <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-start w-full">
                {timelineSteps.map((step, idx) => (
                    <TimelineStep 
                        key={step.key} 
                        step={step} 
                        idx={idx} 
                        isCompleted={!!step.time} 
                        nextStep={timelineSteps[idx + 1]} 
                    />
                ))}
            </div>
        </div>
    </div>
);

const StaffInformation = ({ order }) => {
    if (!order.acceptedBy && !order.preparedBy && !order.servedBy) return null;
    
    const staffList = [];
    
    if (order.acceptedBy && order.acceptedBy._id) {
        staffList.push({ staff: order.acceptedBy, role: 'waiter' });
    }
    if (order.preparedBy && order.preparedBy._id) {
        const alreadyAdded = staffList.find(s => s.staff._id === order.preparedBy._id);
        if (!alreadyAdded) {
            staffList.push({ staff: order.preparedBy, role: 'kitchen' });
        }
    }
    if (order.servedBy && order.servedBy._id) {
        const alreadyAdded = staffList.find(s => s.staff._id === order.servedBy._id);
        if (!alreadyAdded) {
            staffList.push({ staff: order.servedBy, role: 'waiter' });
        }
    }
    
    return (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Staff Information</h3>
            <div className="bg-gray-50 rounded-xl p-5">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Role</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Staff Name</th>
                                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map((item, index) => (
                                <StaffRow key={item.staff._id || index} staff={item.staff} role={item.role} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PerformanceMetrics = ({ waitTime, prepTime, serveTime, totalTime }) => {
    const metrics = [
        { icon: "fa-hourglass-half", label: "Wait Time", value: waitTime, desc: "Created → Accepted", type: 'wait' },
        { icon: "fa-fire-burner", label: "Prep Time", value: prepTime, desc: "Accepted → Ready", type: 'prep' },
        { icon: "fa-bell-concierge", label: "Serve Time", value: serveTime, desc: "Ready → Served", type: 'serve' },
        { icon: "fa-stopwatch", label: "Total Time", value: totalTime, desc: "Start → End", type: 'total' }
    ];
    
    return (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map(m => {
                    const style = m.type === 'total' 
                        ? { color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' } 
                        : getTimeStyle(m.value, m.type);
                    return (
                        <MetricCard 
                            key={m.label} 
                            icon={m.icon} 
                            label={m.label} 
                            value={formatDuration(m.value)} 
                            description={m.desc} 
                            bgClass={style.bg} 
                            colorClass={style.color} 
                        />
                    );
                })}
            </div>
        </div>
    );
};

const OrderItems = ({ items }) => (
    <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Order Items</h3>
        <div className="space-y-3">
            {items?.map((item, idx) => <OrderItem key={idx} item={item} />)}
        </div>
    </div>
);

const OrderNotes = ({ order }) => (
    <>
        {order.note && (
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Customer Note</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                    <i className="fa-solid fa-message mr-2"></i>{order.note}
                </div>
            </div>
        )}
        {order.status === 'rejected' && order.rejectionReason && (
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Rejection Reason</h3>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                    <i className="fa-solid fa-circle-xmark mr-2"></i>{order.rejectionReason}
                </div>
            </div>
        )}
    </>
);

const ModalFooter = ({ order, onClose, onReject, onAccept, onServe }) => (
    <div className="p-6 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-between items-center">
            <div>
                <span className="text-sm text-gray-500">Total Amount</span>
                <div className="text-2xl font-bold text-[#1a1a1a]">
                    ${order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}
                </div>
            </div>
            <div className="flex gap-3">
                {order.status === 'pending' && (
                    <>
                        <button 
                            onClick={() => { onClose(); onReject(order); }} 
                            className="px-6 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
                        >
                            Reject
                        </button>
                        <button 
                            onClick={() => { onAccept(order._id); onClose(); }} 
                            className="px-6 py-3 text-sm font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-[#333] transition"
                        >
                            Accept Order
                        </button>
                    </>
                )}
                {order.status === 'ready' && (
                    <button 
                        onClick={() => { onServe(order._id); onClose(); }} 
                        className="px-6 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition"
                    >
                        Mark as Served
                    </button>
                )}
                <button 
                    onClick={onClose} 
                    className="px-6 py-3 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
);

// ============ MAIN MODAL COMPONENT ============
export default function OrderDetailModal({ show, order, onClose, onReject, onAccept, onServe }) {
    if (!show || !order) return null;

    const actualServedAt = (order.status === 'served' || order.status === 'completed') 
        ? (order.servedAt || order.updatedAt) 
        : order.servedAt;
    const actualReadyAt = order.readyAt || (order.status === 'ready' || actualServedAt ? order.updatedAt : null);
    
    const waitTime = calcDiffSeconds(order.createdAt, order.acceptedAt);
    const prepTime = calcDiffSeconds(order.acceptedAt, actualReadyAt);
    const serveTime = calcDiffSeconds(actualReadyAt, actualServedAt);
    const totalTime = calcDiffSeconds(order.createdAt, actualServedAt || actualReadyAt || order.acceptedAt);
    
    const timelineSteps = [
        { key: 'created', label: 'Created', icon: 'fa-plus-circle', time: order.createdAt },
        { key: 'accepted', label: 'Accepted', icon: 'fa-check-circle', time: order.acceptedAt },
        { key: 'ready', label: 'Ready', icon: 'fa-bell', time: actualReadyAt },
        { key: 'served', label: 'Served', icon: 'fa-utensils', time: actualServedAt },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">
                                    Order #{order._id.slice(-6)}
                                </h2>
                                <StatusBadge status={order.status} />
                            </div>
                            <p className="text-sm text-gray-500">
                                {order.sessionId?.tableId?.name || 'N/A'} • {new Date(order.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <OrderTimeline timelineSteps={timelineSteps} />
                    <StaffInformation order={order} />
                    <PerformanceMetrics 
                        waitTime={waitTime} 
                        prepTime={prepTime} 
                        serveTime={serveTime} 
                        totalTime={totalTime} 
                    />
                    <OrderItems items={order.items} />
                    <OrderNotes order={order} />
                </div>

                {/* Footer */}
                <ModalFooter 
                    order={order} 
                    onClose={onClose} 
                    onReject={onReject} 
                    onAccept={onAccept} 
                    onServe={onServe} 
                />
            </div>
        </div>
    );
}
