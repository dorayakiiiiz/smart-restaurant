import { useEffect, useState } from "react";

export default function OrderCard({ order, type, onAction, onItemAction }) {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const start = new Date(order.createdAt);
            const diff = Math.floor((new Date() - start) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsed(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [order]);

    const isOverdue = type !== 'ready' && (new Date() - new Date(order.createdAt)) > 1000 * 60 * 15;

    // Filter items based on column type
    const displayItems = order.items.filter(item => {
        if (type === 'accepted') return true; // Show all
        if (type === 'preparing') return ['preparing', 'accepted', 'ready'].includes(item.status);
        if (type === 'ready') return item.status === 'ready';
        return true;
    });

    if (displayItems.length === 0) return null;

    return (
        <div className={`
            relative bg-[#1F2937] rounded-lg border-l-4 shadow-md overflow-hidden group transition-all duration-200
            ${type === 'pending' ? 'border-amber-500' : type === 'preparing' ? 'border-blue-500' : 'border-emerald-500'}
        `}>
            {/* Overdue Badge */}
            {isOverdue && type === 'preparing' && (
                <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 flex items-center gap-2 animate-pulse">
                    <FaExclamationTriangle /> OVERDUE
                </div>
            )}

            {/* Card Header */}
            <div className="p-3 pb-2 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-100">#{order.id.substring(0, 6)}</h3>
                    <div className={`flex items-center gap-2 text-sm font-mono mt-0.5 ${isOverdue ? 'text-rose-400 font-bold' : 'text-gray-400'}`}>
                        {/* <FaClock className="text-xs" /> */}
                        <span>{elapsed}</span>
                    </div>
                </div>
                <span className={`
                    px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                    ${type === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                      type === 'preparing' ? 'bg-blue-500/20 text-blue-500' : 
                      'bg-emerald-500/20 text-emerald-500'}
                `}>
                    {order.table || "Table ?"}
                </span>
            </div>

            {/* Items List */}
            <div className="px-3 py-2 space-y-2">
                <div className="h-px bg-gray-700 w-full"></div>
                {displayItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 group/item">
                        {/* Checkbox for preparing/Ready columns */}
                        {type !== 'accepted' && (
                            <button 
                                onClick={() => {
                                    if (type === 'preparing' && item.status !== 'ready') {
                                        onItemAction(item.itemId, 'ready');
                                    } else if (type === 'ready') {
                                        onItemAction(item.itemId, 'served');
                                    }
                                }}
                                className={`mt-0.5 text-lg transition-colors ${
                                    item.status === 'ready' ? 'text-emerald-500' : 'text-gray-600 hover:text-blue-500'
                                }`}
                                disabled={item.status === 'ready' && type === 'preparing'}
                            >
                                {item.status === 'ready' ? <FaCheckSquare /> : <FaSquare />}
                            </button>
                        )}

                        <span className={`
                            flex items-center justify-center w-5 h-5 rounded text-xs font-bold shrink-0
                            ${item.status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'}
                        `}>
                            {item.qty}
                        </span>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${item.status === 'ready' && type === 'preparing' ? 'text-emerald-400' : 'text-gray-200'}`}>
                                {item.name}
                            </p>
                            {item.note && (
                                <p className="text-xs text-indigo-400 italic mt-0.5">
                                    {item.note}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-2 mt-1 bg-[#111827]/30 border-t border-gray-700">
                {type === 'accepted' && (
                    <button 
                        onClick={onAction}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {/* <FaCheckCircle /> Accept & Start */}
                    </button>
                )}
                
                {type === 'preparing' && (
                    <div className="text-center text-xs text-gray-500 font-medium py-1">
                        Check items to mark ready
                    </div>
                )}

                {type === 'ready' && (
                    <div className="text-center text-xs text-gray-500 font-medium py-1">
                        Check items to mark served
                    </div>
                )}
            </div>
        </div>
    );
}