import React from "react";
import { FaHistory, FaTimes, FaUndo, FaUtensils, FaClock, FaChair } from "react-icons/fa";

export default function RecycleBinModal({ show, onClose, historyOrders, onRecall }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-[#111827] w-full max-w-5xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800 flex flex-col max-h-[85vh] overflow-hidden">
                
                {/* Header: Sticky & Gradient */}
                <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <FaHistory className="text-indigo-400" />
                            </div>
                            ORDER HISTORY & RECALL
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Review and restore recently completed orders</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-xl transition-all duration-200"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                    {historyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <FaHistory className="text-6xl mb-4 text-gray-600" />
                            <p className="text-xl font-medium text-gray-500">No history available for today</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {historyOrders.map(order => (
                                <div 
                                    key={order.id} 
                                    className="group bg-[#1F2937] rounded-2xl border border-gray-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col"
                                >
                                    {/* Order Card Header */}
                                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-start bg-gray-800/30 rounded-t-2xl">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider">
                                                    ID: {order.id.substring(0, 8)}
                                                </span>
                                                <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                                    <FaClock className="text-[10px]" />
                                                    {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white font-bold text-lg">
                                                <FaChair className="text-gray-500 text-sm" />
                                                {order.table}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRecall(order.id)}
                                            className="group/btn px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                                        >
                                            <FaUndo className="group-hover/btn:-rotate-45 transition-transform" /> 
                                            RECALL
                                        </button>
                                    </div>

                                    {/* Detailed Item List */}
                                    <div className="p-4 space-y-2 flex-1">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Items ordered</div>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded-lg group-hover:bg-black/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                                                        {item.qty}x
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-300">{item.name}</span>
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    item.status === 'served' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-400'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="px-4 py-3 bg-black/10 rounded-b-2xl border-t border-gray-700/30">
                                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FaUtensils className="text-[10px]" /> 
                                                Total {order.items.length} items
                                            </span>
                                            <span>Completed at {new Date(order.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}