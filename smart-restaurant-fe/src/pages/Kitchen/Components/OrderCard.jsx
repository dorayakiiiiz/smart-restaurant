import { useEffect, useState } from "react";
import { FaCheckCircle, FaCheckSquare, FaExclamationTriangle, FaSquare, FaClock, FaUtensils, FaFire } from "react-icons/fa";

export default function OrderCard({ order, type, onAction, onItemAction }) {
    const [elapsed, setElapsed] = useState("");

    //Effect tính thời gian đã trôi qua kể từ trạng thái hiện tại
    useEffect(() => {
        const interval = setInterval(() => {
            let startTime = null;

            if (type === 'accepted') {
                startTime = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
            } else if (type === 'preparing') {
                startTime = order.preparingAt ? new Date(order.preparingAt) : new Date(order.createdAt);
            } else if (type === 'ready') {
                const finishedTimes = order.items
                    .filter(i => i.status === 'ready' && i.finishedAt)
                    .map(i => new Date(i.finishedAt).getTime());

                if (finishedTimes.length > 0) {
                    startTime = new Date(Math.min(...finishedTimes));
                } 
            }

            const now = new Date();
            const diffInSeconds = Math.floor((now - startTime) / 1000);
            const totalSecs = Math.max(0, diffInSeconds);

            const hours = Math.floor(totalSecs / 3600);
            const minutes = Math.floor((totalSecs % 3600) / 60);
            const seconds = totalSecs % 60;

            setElapsed([
                hours.toString().padStart(2, '0'),
                minutes.toString().padStart(2, '0'),
                seconds.toString().padStart(2, '0')
            ].join(':'));
        }, 1000);

        return () => clearInterval(interval);
    }, [order, type]);

    const maxPrepTime = Math.max(...order.items.map(i => i.prepTime || 15));

    let isOverdue = false;
    if (type === 'preparing' && order.preparingAt) {
         const elapsedMinutes = (new Date() - new Date(order.preparingAt)) / 1000 / 60;
         isOverdue = elapsedMinutes > maxPrepTime;
    }

    const displayItems = order.items.filter(item => {
        if (type === 'accepted') return true;
        if (type === 'preparing') return item.status === 'preparing';
        if (type === 'ready') return item.status === 'ready';
        return true;
    });

    if (displayItems.length === 0) return null;

    // Theme configurations
    const themes = {
        accepted: {
            card: 'bg-gradient-to-br from-[#1f2937] to-[#111827] border-amber-500/30',
            accent: 'text-amber-400',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            timer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25'
        },
        preparing: {
            card: isOverdue 
                ? 'bg-gradient-to-br from-red-950/50 to-[#111827] border-red-500/50 ring-1 ring-red-500/30' 
                : 'bg-gradient-to-br from-[#1f2937] to-[#111827] border-blue-500/30',
            accent: isOverdue ? 'text-red-400' : 'text-blue-400',
            badge: isOverdue 
                ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            timer: isOverdue 
                ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/25'
        },
        ready: {
            card: 'bg-gradient-to-br from-[#1f2937] to-[#111827] border-emerald-500/30',
            accent: 'text-emerald-400',
            badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            timer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            button: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25'
        }
    };

    const theme = themes[type] || themes.accepted;

    return (
        <div className={`
            relative flex flex-col rounded-2xl border-2 shadow-xl 
            transition-all duration-300 hover:translate-y-[-2px] hover:shadow-2xl overflow-hidden
            ${theme.card}
        `}>
            
            {/* Overdue Alert Banner */}
            {isOverdue && type === 'preparing' && (
                <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black py-2.5 px-4 flex items-center justify-between tracking-wider uppercase">
                    <span className="flex items-center gap-2">
                        <FaExclamationTriangle className="animate-bounce text-yellow-300" /> 
                        <span>⚠️ ATTENTION NEEDED</span>
                    </span>
                    <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px]">OVERDUE</span>
                </div>
            )}

            {/* Header */}
            <div className={`p-4 flex justify-between items-start ${isOverdue && type === 'preparing' ? '' : 'border-b border-gray-700/50'}`}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order</span>
                        <h3 className={`text-xl font-black tracking-tight leading-none ${theme.accent}`}>
                            #{order.id?.substring(0, 6).toUpperCase() || 'N/A'}
                        </h3>
                    </div>
                    <div className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold
                        border ${theme.timer}
                    `}>
                        <FaClock className={isOverdue ? 'animate-pulse' : ''} />
                        <span>{elapsed}</span>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-xl border font-black text-base shadow-inner ${theme.badge}`}>
                    🍽️ {order.table || "T-?"}
                </div>
            </div>

            {/* Items List */}
            <div className="px-4 py-3 space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                {displayItems.map((item, idx) => (
                    <div 
                        key={idx} 
                        className={`
                            group/item relative p-3.5 rounded-xl border transition-all duration-200
                            ${item.status === 'ready' 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-[#0d1117] border-gray-700/50 hover:border-gray-600 hover:bg-[#161b22]'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            {type !== 'accepted' && (
                                <button 
                                    onClick={() => {
                                        if (type === 'preparing' && item.status !== 'ready') {
                                            onItemAction(item.itemId, 'ready');
                                        }
                                    }}
                                    className={`
                                        mt-0.5 text-2xl transition-all duration-200 transform active:scale-90
                                        ${item.status === 'ready' 
                                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                            : 'text-gray-600 hover:text-blue-400'
                                        }
                                    `}
                                    disabled={item.status === 'ready' && type === 'preparing'}
                                >
                                    {item.status === 'ready' ? <FaCheckSquare /> : <FaSquare />}
                                </button>
                            )}

                            <div className="flex-1 min-w-0">
                                {/* Item Name & Qty */}
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`
                                        text-base font-bold truncate leading-tight
                                        ${item.status === 'ready' ? 'text-emerald-400/60 line-through' : 'text-gray-100'}
                                    `}>
                                        {item.name}
                                    </p>
                                    <span className={`
                                        ml-3 flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg font-black text-sm
                                        ${item.status === 'ready' 
                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                            : 'bg-gray-800 text-white border border-gray-700'
                                        }
                                    `}>
                                        ×{item.qty}
                                    </span>
                                </div>

                                {/* Prep Time */}
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    <FaUtensils className="text-[10px]" />
                                    <span>{item.prepTime || 15} mins prep</span>
                                </div>
                                
                                {/* Modifiers */}
                                {item.modifiers?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {item.modifiers.map((mod, mIdx) => (
                                            <span 
                                                key={mIdx} 
                                                className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/20"
                                            >
                                                {mod.option}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Note */}
                                {item.note && (
                                    <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border-l-3 border-amber-500 italic flex items-start gap-2">
                                        <span>📝</span>
                                        <span>"{item.note}"</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-700/50 bg-black/20">
                {type === 'accepted' && (
                    <button 
                        onClick={onAction}
                        className={`
                            w-full py-4 rounded-xl font-black text-base uppercase tracking-wider
                            text-white transition-all flex items-center justify-center gap-3 
                            active:scale-[0.98] ${theme.button}
                        `}
                    >
                        <FaFire className="text-lg" /> 
                        Start Cooking
                    </button>
                )}
                
                {type === 'preparing' && (
                    <button 
                        onClick={onAction}
                        className={`
                            w-full py-4 rounded-xl font-black text-base uppercase tracking-wider
                            text-white transition-all flex items-center justify-center gap-3 
                            active:scale-[0.98] ${theme.button}
                        `}
                    >
                        <FaCheckCircle className="text-lg" /> 
                        Mark All Ready
                    </button>
                )}

                {type === 'ready' && (
                    <div className={`
                        w-full py-4 rounded-xl font-black text-base uppercase tracking-wider
                        text-white flex items-center justify-center gap-3 ${theme.button}
                    `}>
                        <span className="text-xl">🍽️</span>
                        Ready to Serve
                    </div>
                )}
            </div>
        </div>
    );
}