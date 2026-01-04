import { useState } from "react";
import ItemDetailsModal from "./ItemDetailsModal";

// ============ TOP SELLING ITEMS TABLE COMPONENT ============
export default function TopSellingItemsTable({ 
    data, 
    isLoading, 
    period, 
    customDateStart, 
    customDateEnd, 
    getPeriodLabel, 
    formatCurrency, 
    renderTrend 
}) {
    const [sortBy, setSortBy] = useState('revenue'); // revenue, orders, quantity
    const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Handle sort column click
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    // Sort data
    const sortedData = data ? [...data].sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'revenue') {
            aValue = a.totalRevenue;
            bValue = b.totalRevenue;
        } else if (sortBy === 'orders') {
            aValue = a.orderCount;
            bValue = b.orderCount;
        } else if (sortBy === 'quantity') {
            aValue = a.totalQuantity;
            bValue = b.totalQuantity;
        }

        if (sortOrder === 'desc') {
            return bValue - aValue;
        } else {
            return aValue - bValue;
        }
    }) : [];

    // Handle row click
    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };



    // Get rank badge color (thống nhất với DashboardOverview)
    const getRankBadgeClass = (rank) => {
        if (rank === 1) return 'bg-red-500 text-white';
        if (rank === 2) return 'bg-orange-500 text-white';
        if (rank === 3) return 'bg-yellow-500 text-white';
        return 'bg-gray-400 text-white';
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Top Selling Items</h3>
                <p className="text-xs text-gray-500 mb-4">Loading...</p>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            </div>
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Top Selling Items</h3>
                <p className="text-xs text-gray-500 mb-4">Best performing items in {getPeriodLabel().toLowerCase()}</p>
                <div className="text-center py-12">
                    <i className="fa-solid fa-utensils text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500 text-sm">No top items data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Top Selling Items</h3>
                    <p className="text-xs text-gray-500">Best performing items in {getPeriodLabel().toLowerCase()}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Rank
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Item
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Category
                            </th>
                            <th 
                                className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-[#D4AF37] transition-colors"
                                onClick={() => handleSort('quantity')}
                            >
                                Quantity
                            </th>
                            <th 
                                className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-[#D4AF37] transition-colors"
                                onClick={() => handleSort('orders')}
                            >
                                Orders
                            </th>
                            <th 
                                className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-[#D4AF37] transition-colors"
                                onClick={() => handleSort('revenue')}
                            >
                                Revenue
                            </th>
                            <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Trend
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((item, index) => (
                            <tr 
                                key={item.menuItemId || index}
                                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleRowClick(item)}
                            >
                                <td className="py-4 px-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getRankBadgeClass(item.rank)}`}>
                                        {item.rank}
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <i className="fa-solid fa-utensils text-gray-400"></i>
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(item.price)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="text-sm text-gray-600">
                                        {item.category?.name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <span className="text-sm font-medium text-gray-800">
                                        {item.totalQuantity}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <span className="text-sm font-medium text-gray-800">
                                        {item.orderCount}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <span className="text-sm font-bold text-green-600">
                                        {formatCurrency(item.totalRevenue)}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex justify-center">
                                        {renderTrend(item.trend)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedItem && (
                <ItemDetailsModal
                    item={selectedItem}
                    period={period}
                    customDateStart={customDateStart}
                    customDateEnd={customDateEnd}
                    getPeriodLabel={getPeriodLabel}
                    formatCurrency={formatCurrency}
                    renderTrend={renderTrend}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
