// Modal chọn role (Bước 1)
export default function RoleSelectionModal({ onClose, onSelectRole }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold font-momo text-[#1a1a1a] mb-2">Create Staff</h3>
                <p className="text-gray-500 text-sm mb-6">Select the type of staff you want to create</p>
                
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => onSelectRole('waiter')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🍽️
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 group-hover:text-blue-600">Waiter</div>
                            <div className="text-xs text-gray-500">Front-of-house staff for serving customers</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectRole('kitchen')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            👨‍🍳
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 group-hover:text-orange-600">Kitchen Staff</div>
                            <div className="text-xs text-gray-500">Back-of-house staff for food preparation</div>
                        </div>
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
