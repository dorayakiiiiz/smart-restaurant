import OrderRow from './OrderRow';

// ============ ORDERS TABLE COMPONENT ============
export default function OrdersTable({ orders, onViewDetail, onReject, onAccept, onServe }) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No orders found</h3>
                <p className="text-gray-500">
                    Orders will appear here when customers place them
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Table
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                        <OrderRow 
                            key={order._id} 
                            order={order} 
                            onViewDetail={onViewDetail} 
                            onReject={onReject} 
                            onAccept={onAccept} 
                            onServe={onServe} 
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
