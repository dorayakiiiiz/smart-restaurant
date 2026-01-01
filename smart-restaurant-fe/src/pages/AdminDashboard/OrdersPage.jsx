import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import { waiterService } from "../../services/waiterService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../../components/Shared/Button";

// ============ HELPER FUNCTIONS ============
const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;

const calcDiffSeconds = (start, end) => (start && end) ? Math.round((new Date(end) - new Date(start)) / 1000) : null;

const formatDuration = (seconds) => {
    if (!seconds) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60), secs = seconds % 60, hours = Math.floor(seconds / 3600);
    if (seconds < 3600) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const m = Math.floor((seconds % 3600) / 60);
    return `${hours}h${m ? ` ${m}m` : ''}${secs && !m ? ` ${secs}s` : ''}`;
};

const getTimeStyle = (seconds, type) => {
    if (!seconds) return { color: 'text-gray-400', bg: 'bg-gray-50 border border-gray-200' };
    const mins = seconds / 60;
    const thresholds = { wait: [2, 5], prep: [10, 20], serve: [3, 7] };
    const [good, warning] = thresholds[type] || [0, 0];
    const level = mins <= good ? 'green' : mins <= warning ? 'yellow' : 'red';
    return { 
        color: `text-${level}-600`, 
        bg: `bg-${level}-50 border border-${level}-200` 
    };
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

const STEP_COLORS = {
    created: { bg: 'bg-orange-500', bgInactive: 'bg-orange-100', textInactive: 'text-orange-300' },
    accepted: { bg: 'bg-blue-500', bgInactive: 'bg-blue-100', textInactive: 'text-blue-300' },
    ready: { bg: 'bg-green-500', bgInactive: 'bg-green-100', textInactive: 'text-green-300' },
    served: { bg: 'bg-gray-500', bgInactive: 'bg-gray-100', textInactive: 'text-gray-300' }
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

const ActionButtons = ({ order, onReject, onAccept, onServe, onViewDetail }) => {
    const viewBtn = <button onClick={() => onViewDetail(order)} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">{['served', 'completed', 'rejected'].includes(order.status) ? 'View Detail' : 'View'}</button>;
    
    const actions = {
        pending: [
            <button key="reject" onClick={() => onReject(order)} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Reject</button>,
            <button key="accept" onClick={() => onAccept(order._id)} className="px-3 py-1.5 text-xs font-bold text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] transition">Accept</button>,
            viewBtn
        ],
        ready: [
            <button key="serve" onClick={() => onServe(order._id)} className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">Serve</button>,
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

const OrderRow = ({ order, onViewDetail, onReject, onAccept, onServe }) => {
    const isNew = (Date.now() - new Date(order.createdAt)) < 60000;
    const totalPrice = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    
    return (
        <tr className={`hover:bg-gray-50 transition ${isNew ? 'bg-orange-50' : ''}`}>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">#{order._id.slice(-6)}</span>
                        {isNew && <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full animate-pulse">NEW</span>}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4"><div className="font-semibold text-sm text-gray-800">{order.sessionId?.tableId?.name || 'N/A'}</div></td>
            <td className="px-4 py-4">
                <div className="text-sm text-gray-600 space-y-1">
                    {order.items?.slice(0, 2).map((item, idx) => <div key={idx}>{item.quantity}x {item.name}</div>)}
                    {order.items?.length > 2 && <div className="text-xs text-blue-600 font-semibold">+{order.items.length - 2} more</div>}
                </div>
            </td>
            <td className="px-4 py-4"><span className="font-bold text-sm text-gray-800">${totalPrice.toFixed(2)}</span></td>
            <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
            <td className="px-4 py-4"><span className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</span></td>
            <td className="px-4 py-4"><ActionButtons order={order} onReject={onReject} onAccept={onAccept} onServe={onServe} onViewDetail={onViewDetail} /></td>
        </tr>
    );
};

const FilterModal = ({ show, onClose, selectedTable, setSelectedTable, dateFilter, setDateFilter, customDateStart, setCustomDateStart, customDateEnd, setCustomDateEnd, uniqueTables, onApply, onReset }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                            <i className="fa-solid fa-filter text-[#D4AF37]"></i>
                        </div>
                        <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Filter Orders</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                    </button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Table</label>
                        <div className="relative">
                            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white">
                                <option value="all">All Tables</option>
                                {uniqueTables.map(table => <option key={table} value={table}>{table}</option>)}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Date</label>
                        <div className="relative">
                            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                        </div>
                    </div>
                    {dateFilter === "custom" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                <input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                <input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onReset} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors">Reset</button>
                    <button onClick={onApply} className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-[#333] transition-colors">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

const RejectModal = ({ show, order, reason, setReason, onConfirm, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Reject Order</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting order <span className="font-bold">#{order?._id.slice(-6)}</span>:</p>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 h-32 resize-none focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="e.g., Out of stock, Kitchen closed..." autoFocus />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={onConfirm} disabled={!reason.trim()} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Confirm Reject</button>
                </div>
            </div>
        </div>
    );
};

const TimelineStep = ({ step, idx, isCompleted, nextStep, calcDiffSeconds, formatTime, formatDuration }) => {
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
                <div className={`text-xs font-bold mt-2 whitespace-nowrap ${isCompleted ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{step.label}</div>
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
            <td className="py-3 px-4"><span className="text-sm font-bold text-[#1a1a1a]">{staff.fullName || '-'}</span></td>
            <td className="py-3 px-4"><span className="text-sm text-gray-600">{staff.email || '-'}</span></td>
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
                        {item.modifiers.map((mod, i) => <span key={i} className="mr-2">+ {mod.name}</span>)}
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

const OrderTimeline = ({ timelineSteps }) => (
    <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Order Timeline</h3>
        <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-start w-full">
                {timelineSteps.map((step, idx) => (
                    <TimelineStep key={step.key} step={step} idx={idx} isCompleted={!!step.time} nextStep={timelineSteps[idx + 1]} calcDiffSeconds={calcDiffSeconds} formatTime={formatTime} formatDuration={formatDuration} />
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
                    const style = m.type === 'total' ? { color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' } : getTimeStyle(m.value, m.type);
                    return <MetricCard key={m.label} icon={m.icon} label={m.label} value={formatDuration(m.value)} description={m.desc} bgClass={style.bg} colorClass={style.color} />;
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
                <div className="text-2xl font-bold text-[#1a1a1a]">${order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</div>
            </div>
            <div className="flex gap-3">
                {order.status === 'pending' && (
                    <>
                        <button onClick={() => { onClose(); onReject(order); }} className="px-6 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition">Reject</button>
                        <button onClick={() => { onAccept(order._id); onClose(); }} className="px-6 py-3 text-sm font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-[#333] transition">Accept Order</button>
                    </>
                )}
                {order.status === 'ready' && <button onClick={() => { onServe(order._id); onClose(); }} className="px-6 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition">Mark as Served</button>}
                <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition">Close</button>
            </div>
        </div>
    </div>
);

const OrderDetailModal = ({ show, order, onClose, onReject, onAccept, onServe }) => {
    if (!show || !order) return null;

    const actualServedAt = (order.status === 'served' || order.status === 'completed') ? (order.servedAt || order.updatedAt) : order.servedAt;
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
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Order #{order._id.slice(-6)}</h2>
                                <StatusBadge status={order.status} />
                            </div>
                            <p className="text-sm text-gray-500">{order.sessionId?.tableId?.name || 'N/A'} • {formatDateTime(order.createdAt)}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <OrderTimeline timelineSteps={timelineSteps} />
                    <StaffInformation order={order} />
                    <PerformanceMetrics waitTime={waitTime} prepTime={prepTime} serveTime={serveTime} totalTime={totalTime} />
                    <OrderItems items={order.items} />
                    <OrderNotes order={order} />
                </div>
                <ModalFooter order={order} onClose={onClose} onReject={onReject} onAccept={onAccept} onServe={onServe} />
            </div>
        </div>
    );
};

// ============ MAIN COMPONENT ============
export default function OrdersPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedTable, setSelectedTable] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDateStart, setCustomDateStart] = useState("");
    const [customDateEnd, setCustomDateEnd] = useState("");

    useEffect(() => {
        if (!user || !user.restaurantId) return;

        const updateOrderInCache = (updatedOrder) => {
            queryClient.setQueryData(['admin-orders', 'all'], (old = []) => {
                const exists = old.find(o => o._id === updatedOrder._id);
                if (exists) {
                    return old.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                }
                return [updatedOrder, ...old];
            });

            const tabMapping = {
                'pending': 'received',
                'accepted': 'preparing',
                'preparing': 'preparing',
                'ready': 'ready',
                'completed': 'completed',
                'served': 'completed'
            };

            const targetTab = tabMapping[updatedOrder.status];
            if (targetTab) {
                queryClient.setQueryData(['admin-orders', targetTab], (old = []) => {
                    const exists = old.find(o => o._id === updatedOrder._id);
                    if (exists) {
                        return old.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                    }
                    return [updatedOrder, ...old];
                });
            }

            Object.values(tabMapping).forEach(tab => {
                if (tab !== targetTab) {
                    queryClient.setQueryData(['admin-orders', tab], (old = []) => {
                        return old ? old.filter(o => o._id !== updatedOrder._id) : [];
                    });
                }
            });
        };

        const handleNewOrder = (order) => updateOrderInCache(order);
        const handleOrderUpdate = (order) => updateOrderInCache(order);

        socket.on("new_order_alert", handleNewOrder);
        socket.on("order_accepted", handleOrderUpdate);
        socket.on("order_rejected", handleOrderUpdate);
        socket.on("kitchen:order_update", handleOrderUpdate);
        socket.on("waiter:order_ready", handleOrderUpdate);
        socket.on("order_served", handleOrderUpdate);
        socket.on("order_completed", handleOrderUpdate);
        socket.on("order_update", handleOrderUpdate);

        return () => {
            socket.off("new_order_alert", handleNewOrder);
            socket.off("order_accepted", handleOrderUpdate);
            socket.off("order_rejected", handleOrderUpdate);
            socket.off("kitchen:order_update", handleOrderUpdate);
            socket.off("waiter:order_ready", handleOrderUpdate);
            socket.off("order_served", handleOrderUpdate);
            socket.off("order_completed", handleOrderUpdate);
            socket.off("order_update", handleOrderUpdate);
        };
    }, [user?.restaurantId, queryClient]);

    const { data: allOrdersForCounts = [] } = useQuery({
        queryKey: ['admin-orders', 'all'],
        queryFn: async () => {
            const res = await waiterService.getAllOrders();
            return res.data.orders || [];
        }
    });

    const { data: allOrders = [], isLoading, error } = useQuery({
        queryKey: ['admin-orders', activeTab],
        queryFn: async () => {
            if (activeTab === "all") {
                const res = await waiterService.getAllOrders();
                return res.data.orders || [];
            } else if (activeTab === "received") {
                const res = await waiterService.getPendingOrders();
                return res.data.orders || [];
            } else if (activeTab === "preparing") {
                const res = await waiterService.getAcceptedOrders();
                return res.data.orders || [];
            } else if (activeTab === "ready") {
                const res = await waiterService.getReadyOrders();
                const orders = res.data.orders || [];
                return orders.filter(order => !order.items?.some(item => ['preparing', 'pending', 'confirmed'].includes(item.status)));
            } else if (activeTab === "completed") {
                const res = await waiterService.getAllOrders();
                return (res.data.orders || []).filter(o => ['completed', 'served'].includes(o.status));
            }
            return [];
        }
    });

    const acceptMutation = useMutation({
        mutationFn: (orderId) => waiterService.acceptOrder(orderId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    });

    const rejectMutation = useMutation({
        mutationFn: ({ orderId, reason }) => waiterService.rejectOrder(orderId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setShowRejectModal(false);
            setRejectionReason("");
            setSelectedOrder(null);
        }
    });

    const serveMutation = useMutation({
        mutationFn: async (orderId) => {
            await waiterService.markAsServed(orderId);
            await waiterService.markOrderComplete(orderId);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    });

    const handleAccept = (orderId) => acceptMutation.mutate(orderId);
    const handleRejectClick = (order) => { setSelectedOrder(order); setShowRejectModal(true); };
    const handleRejectConfirm = () => {
        if (!selectedOrder || !rejectionReason.trim()) return;
        rejectMutation.mutate({ orderId: selectedOrder._id, reason: rejectionReason });
    };
    const handleServe = (orderId) => serveMutation.mutate(orderId);
    const handleViewDetail = (order) => { setSelectedOrder(order); setShowDetailModal(true); };

    const filterByDate = (order) => {
        if (dateFilter === "all") return true;
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateFilter === "today") return orderDate >= today;
        if (dateFilter === "yesterday") {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return orderDate >= yesterday && orderDate < today;
        }
        if (dateFilter === "week") {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
        }
        if (dateFilter === "month") {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
        }
        if (dateFilter === "custom" && customDateStart && customDateEnd) {
            const start = new Date(customDateStart);
            const end = new Date(customDateEnd);
            end.setHours(23, 59, 59, 999);
            return orderDate >= start && orderDate <= end;
        }
        return true;
    };

    const filteredOrders = allOrders.filter(order => {
        const matchSearch = searchText === "" || order._id.toLowerCase().includes(searchText.toLowerCase()) || order.sessionId?.tableId?.name?.toLowerCase().includes(searchText.toLowerCase());
        const matchTable = selectedTable === "all" || order.sessionId?.tableId?.name === selectedTable;
        const matchDate = filterByDate(order);
        return matchSearch && matchTable && matchDate;
    });

    const tabCounts = {
        all: allOrdersForCounts.length,
        received: allOrdersForCounts.filter(o => o.status === 'pending').length,
        preparing: allOrdersForCounts.filter(o => ['accepted', 'preparing'].includes(o.status)).length,
        ready: allOrdersForCounts.filter(o => o.status === 'ready').length,
        completed: allOrdersForCounts.filter(o => ['completed', 'served'].includes(o.status)).length,
    };

    const uniqueTables = [...new Set(allOrders.map(o => o.sessionId?.tableId?.name).filter(Boolean))];
    const resetFilters = () => { setSelectedTable("all"); setDateFilter("all"); setCustomDateStart(""); setCustomDateEnd(""); };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <i className="fa-solid fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p className="text-red-600 font-bold mb-2">Error loading orders</p>
                    <p className="text-gray-500 text-sm">{error.message}</p>
                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })} className="mt-4 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333]">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-quicksand">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-momo text-[#1a1a1a]">Orders</h1>
                    <p className="text-gray-500">Manage and track all orders in real-time</p>
                </div>
                <Button backgrond={{ normal: "#1a1a1a", hover: "#333" }} color="#fff" text={<><i className="fa-solid fa-tv mr-2"></i>Open KDS</>} onClick={() => navigate('/system/admin/kds')} />
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { key: "all", label: "All Orders" },
                    { key: "received", label: "Received" },
                    { key: "preparing", label: "Preparing" },
                    { key: "ready", label: "Ready" },
                    { key: "completed", label: "Completed" },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeTab === tab.key ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                        {tab.label}
                        {tabCounts[tab.key] > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key ? "bg-white text-[#1a1a1a]" : "bg-gray-100 text-gray-600"}`}>{tabCounts[tab.key]}</span>}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 mb-8 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Search by order ID or table..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full h-[50px] rounded-xl bg-white pl-10 pr-4 outline-none border border-gray-200 focus:border-[#D4AF37] transition-colors" />
                    </div>
                </div>
                <button onClick={() => setShowFilterModal(true)} className="h-[50px] px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors font-bold text-gray-700 flex items-center gap-2">
                    <i className="fa-solid fa-filter"></i>Filters
                    {(selectedTable !== "all" || dateFilter !== "all") && <span className="ml-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No orders found</h3>
                        <p className="text-gray-500">{searchText || selectedTable !== "all" || dateFilter !== "all" ? "Try adjusting your filters" : "Orders will appear here when customers place them"}</p>
                    </div>
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
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map(order => <OrderRow key={order._id} order={order} onViewDetail={handleViewDetail} onReject={handleRejectClick} onAccept={handleAccept} onServe={handleServe} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <FilterModal show={showFilterModal} onClose={() => setShowFilterModal(false)} selectedTable={selectedTable} setSelectedTable={setSelectedTable} dateFilter={dateFilter} setDateFilter={setDateFilter} customDateStart={customDateStart} setCustomDateStart={setCustomDateStart} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} uniqueTables={uniqueTables} onApply={() => setShowFilterModal(false)} onReset={resetFilters} />
            <RejectModal show={showRejectModal} order={selectedOrder} reason={rejectionReason} setReason={setRejectionReason} onConfirm={handleRejectConfirm} onClose={() => { setShowRejectModal(false); setRejectionReason(""); setSelectedOrder(null); }} />
            <OrderDetailModal show={showDetailModal} order={selectedOrder} onClose={() => setShowDetailModal(false)} onReject={handleRejectClick} onAccept={handleAccept} onServe={handleServe} />
        </div>
    );
}
