import React from "react";
import { FaHistory, FaTimes, FaUndo } from "react-icons/fa";

export default function RecycleBinModal({ show, onClose, historyOrders, onRecall }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1F2937] w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaHistory className="text-indigo-400" />
                        Order History & Recall
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <FaTimes className="text-xl text-gray-400" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyOrders.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No history available
                        </div>
                    ) : (
                        historyOrders.map(order => (
                            <div key={order.id} className="bg-[#111827] p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg text-gray-200">Order #{order.id.substring(0, 6)}</div>
                                    <div className="text-sm text-gray-400">{order.table} • {order.items.length} items</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Finished: {new Date(order.updatedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onRecall(order.id)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <FaUndo /> Recall
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}