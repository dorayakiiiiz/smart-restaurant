// ============ REJECT MODAL COMPONENT ============
export default function RejectModal({ show, order, reason, setReason, onConfirm, onClose }) {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Reject Order</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                    Please provide a reason for rejecting order <span className="font-bold">#{order?._id.slice(-6)}</span>:
                </p>
                
                <textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 h-32 resize-none focus:outline-none focus:border-[#D4AF37] transition-colors" 
                    placeholder="e.g., Out of stock, Kitchen closed..." 
                    autoFocus 
                />
                
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={!reason.trim()} 
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
