// ============ FILTER MODAL COMPONENT ============
export default function FilterModal({ 
    show, 
    onClose, 
    selectedTable, 
    setSelectedTable, 
    dateFilter, 
    setDateFilter, 
    customDateStart, 
    setCustomDateStart, 
    customDateEnd, 
    setCustomDateEnd, 
    uniqueTables, 
    onApply, 
    onReset 
}) {
    if (!show) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                            <i className="fa-solid fa-filter text-[#D4AF37]"></i>
                        </div>
                        <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Filter Orders</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                    </button>
                </div>

                {/* Filter Content */}
                <div className="space-y-5">
                    {/* Table Filter */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Table</label>
                        <div className="relative">
                            <select 
                                value={selectedTable} 
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white"
                            >
                                <option value="all">All Tables</option>
                                {uniqueTables.map(table => (
                                    <option key={table} value={table}>{table}</option>
                                ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Date</label>
                        <div className="relative">
                            <select 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer appearance-none bg-white"
                            >
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

                    {/* Custom Date Range */}
                    {dateFilter === "custom" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                <input 
                                    type="date" 
                                    value={customDateStart} 
                                    onChange={(e) => setCustomDateStart(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                <input 
                                    type="date" 
                                    value={customDateEnd} 
                                    onChange={(e) => setCustomDateEnd(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onReset} 
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
