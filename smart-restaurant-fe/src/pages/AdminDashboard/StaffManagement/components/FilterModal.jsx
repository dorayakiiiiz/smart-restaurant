// Filter Modal Component
export default function FilterModal({ 
    show, 
    onClose, 
    selectedRole, 
    setSelectedRole, 
    selectedStatus, 
    setSelectedStatus, 
    onApply, 
    onReset 
}) {
    if (!show) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                            <i className="fa-solid fa-filter text-[#D4AF37] text-lg"></i>
                        </div>
                        <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Filter Staff</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-gray-500 hover:text-gray-700 text-xl"></i>
                    </button>
                </div>

                {/* Filter Content */}
                <div className="space-y-5">
                    {/* Role Filter */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Role</label>
                        <div className="relative">
                            <select 
                                value={selectedRole} 
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="waiter">Waiter</option>
                                <option value="kitchen">Kitchen</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
                        <div className="relative">
                            <select 
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="locked">Locked</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={() => {
                            onReset();
                            onClose();
                        }}
                        className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={onApply}
                        className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-[#333] transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
