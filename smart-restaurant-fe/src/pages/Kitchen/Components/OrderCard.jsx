import { useEffect, useState } from "react";
import { FaCheckCircle, FaCheckSquare, FaExclamationTriangle, FaSquare, FaClock, FaUtensils } from "react-icons/fa";

export default function OrderCard({ order, type, onAction, onItemAction }) {
    const [elapsed, setElapsed] = useState("");

    //Effect thời gian
    useEffect(() => {
        const interval = setInterval(() => {
            let startTime = null;

            if (type === 'accepted') {
                startTime = order.acceptedAt ? new Date(order.acceptedAt) : new Date(order.createdAt);
            } else if (type === 'preparing') {
                startTime = order.preparingAt ? new Date(order.preparingAt) : new Date(order.createdAt);
            } else if (type === 'ready') {
                // Lọc ra các item đã xong và có finishedAt
                const finishedTimes = order.items
                    .filter(i => i.status === 'ready' && i.finishedAt)
                    .map(i => new Date(i.finishedAt).getTime());

                if (finishedTimes.length > 0) {
                    // Lấy món xong sớm nhất (nhỏ nhất)
                    startTime = new Date(Math.min(...finishedTimes));
                } 
            }

            const now = new Date();
            const diffInSeconds = Math.floor((now - startTime) / 1000);
            
            // Đảm bảo không bị số âm
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
    }, [order, type]); // Dependency nên là cả object order để nhạy bén với thay đổi

    // Calculate max prep time from items
    // Vì mỗi item có prepTime khác nhau
    const maxPrepTime = Math.max(...order.items.map(i => i.prepTime || 15));

    // Overdue logic: Chỉ tính khi đang preparing, dựa vào preparingAt và maxPrepTime
    let isOverdue = false;
    if (type === 'preparing' && order.preparingAt) {
         const elapsedMinutes = (new Date() - new Date(order.preparingAt)) / 1000 / 60;
         //chỉ overdue khi thời gian từ lúc bấm accept lớn hơn preptime
         isOverdue = elapsedMinutes > maxPrepTime;
    }

    const displayItems = order.items.filter(item => {
        if (type === 'accepted') return true;
        if (type === 'preparing') return item.status === 'preparing';
        if (type === 'ready') return item.status === 'ready';
        return true;
    });

    if (displayItems.length === 0) return null;
    // Phân loại màu sắc theo Type
    const themeColor = {
        pending: 'border-amber-500 text-amber-500 bg-amber-500/10',
        preparing: 'border-sky-500 text-sky-500 bg-sky-500/10',
        ready: 'border-emerald-500 text-emerald-500 bg-emerald-500/10',
        accepted: 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
    }[type] || 'border-gray-500';

    return (
        <div className={`
            relative flex flex-col h-full bg-[#1A1F2B] rounded-xl border-t-4 shadow-xl 
            transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl overflow-hidden
            ${isOverdue && type === 'preparing' ? 'ring-2 ring-rose-500 ring-inset' : 'border-[#2D3748]'}
            ${themeColor.split(' ')[0]} 
        `}>
            
            {/* Overdue Alert Layer */}
            {isOverdue && type === 'preparing' && (
                <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white text-[10px] font-black py-1 px-3 flex items-center justify-between z-10 tracking-widest uppercase">
                    <span className="flex items-center gap-1"><FaExclamationTriangle className="animate-bounce" /> Attention Needed</span>
                    <span>15M+ LATE</span>
                </div>
            )}

            {/* Header Area */}
            <div className={`p-4 flex justify-between items-start ${isOverdue && type === 'preparing' ? 'pt-7' : ''}`}>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Order ID</span>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none">
                            #{order.id.substring(0, 6).toUpperCase()}
                        </h3>
                    </div>
                    <div className={`
                        inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-xs
                        ${isOverdue ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-300'}
                    `}>
                        <FaClock className={isOverdue ? 'animate-pulse' : ''} />
                        <span className="font-bold">{elapsed}</span>
                    </div>
                </div>

                <div className={`px-3 py-1.5 rounded-lg border-2 font-black text-sm shadow-inner ${themeColor}`}>
                    {order.table || "T-00"}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-4 py-2 custom-scrollbar overflow-y-auto max-h-[300px]">
                <div className="space-y-3">
                    {displayItems.map((item, idx) => (
                        <div key={idx} className="group/item relative bg-[#242C3D] p-3 rounded-lg border border-gray-700/50 transition-colors hover:bg-[#2D3748]">
                            <div className="flex items-start gap-3">
                                {/* Interactive Checkbox */}
                                {type !== 'accepted' && (
                                    <button 
                                        onClick={() => {
                                            if (type === 'preparing' && item.status !== 'ready') {
                                                onItemAction(item.itemId, 'ready');
                                            }
                                        }}
                                        className={`mt-0.5 text-xl transition-all duration-200 transform active:scale-90 ${
                                            item.status === 'ready' ? 'text-emerald-400' : 'text-gray-600 hover:text-sky-400'
                                        }`}
                                        disabled={item.status === 'ready' && type === 'preparing'}
                                    >
                                        {item.status === 'ready' ? <FaCheckSquare /> : <FaSquare />}
                                    </button>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-[15px] font-bold truncate leading-tight ${item.status === 'ready' ? 'text-emerald-400/70 line-through' : 'text-gray-100'}`}>
                                            {item.name}
                                        </p>
                                        <span className={`
                                            ml-2 flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded font-black text-xs
                                            ${item.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-white'}
                                        `}>
                                            x{item.qty}
                                        </span>
                                    </div>

                                    {/* Item Details */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                            <FaUtensils className="text-[10px]" />
                                            <span>{item.prepTime} mins prep</span>
                                        </div>
                                        
                                        {item.modifiers?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.modifiers.map((mod, mIdx) => (
                                                    <span key={mIdx} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                        {mod.option}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {item.note && (
                                            <div className="mt-2 text-[11px] text-amber-400 bg-amber-400/5 p-1.5 rounded border-l-2 border-amber-500/50 italic">
                                                "{item.note}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 mt-2 bg-[#111827]/80 backdrop-blur-sm border-t border-gray-800">
                {type === 'accepted' && (
                    <button 
                        onClick={onAction}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-black text-sm shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <FaCheckCircle className="text-lg" /> ACCEPT & START COOKING
                    </button>
                )}
                
                {type === 'preparing' && (
                    <button 
                        onClick={onAction}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg font-black text-sm shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <FaCheckCircle className="text-lg" /> Finish all
                    </button>
                )}

                {type === 'ready' && (
                    <div className="py-1 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-center">
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Ready to Serve</span>
                    </div>
                )}
            </div>
        </div>
    );
}