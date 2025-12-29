import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { orderService } from "../../services/orderService";
import { socket } from "../../services/socket";

export default function OrderTrackingPage() {
    const { sessionInfo } = useCart();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Orders ban đầu
    const fetchOrders = async () => {
        if (!sessionInfo?.session?._id) return;
        try {
            const data = await orderService.getSessionDetails(sessionInfo.session._id);
            setOrders(data.orders || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();


        // khi customer quét -> đặt 1 order -> gọi place order trên controller
        // -> controller .to(sessionid).emit(order_update) và .to(waiter).emit(new_order_alert)
        // -> orrder_update ở đây nhận dc và thêm order mới vào order page

        // 2. Listen Socket Events (Realtime Update)
        // Khi bếp đổi trạng thái -> Server bắn 'order_update' -> Client nhận và cập nhật state
        socket.on("order_update", (updatedOrder) => {
            setOrders(prevOrders => {
                // Kiểm tra xem order này đã có trong list chưa
                const exists = prevOrders.find(o => o._id === updatedOrder._id);
                if (exists) {
                    // Nếu có rồi -> Update đè lên
                    return prevOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                }
                // Nếu chưa (ví dụ người khác cùng bàn đặt) -> Thêm vào đầu list
                return [updatedOrder, ...prevOrders];
            });
        });

        return () => {
            socket.off("order_update");
        };
    }, [sessionInfo]);

    const handleRequestBill = async () => {
        if(confirm("Request bill for this table?")) {
            try {
                await orderService.requestCheckout(sessionInfo.session._id, 'cash');
                alert("Bill requested! Waiter is coming.");
            } catch(err) {
                alert("Error requesting bill.");
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Orders...</div>;

    // Tính tổng tiền session
    const sessionTotal = orders.reduce((acc, order) => {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return acc + orderTotal;
    }, 0);

    return (
        <div className="p-6 pb-32">
            {/* Header Summary */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h2 className="text-gray-400 text-sm mb-1">Current Session Total</h2>
                <div className="font-momo font-bold text-4xl text-[#D4AF37] mb-4">${sessionTotal.toFixed(2)}</div>
                <button 
                    onClick={handleRequestBill}
                    className="w-full py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition"
                >
                    Request Bill
                </button>
            </div>

            <h3 className="font-bold text-xl mb-4 text-gray-800">Order History</h3>

            <div className="space-y-6">
                {orders.map(order => (
                    <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                            <span className="text-xs font-bold text-gray-400">#{order._id.slice(-4)} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <StatusBadge status={order.status} items={order.items} />
                        </div>

                        {/* Timeline Visualizer */}
                        <div className="flex justify-between items-center mb-6 px-2 relative">
                            {/* Line */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10"></div>
                            <div className={`absolute left-0 top-1/2 h-0.5 bg-green-500 -z-10 transition-all duration-500`} 
                                style={{ width: getProgressWidth(order.status, order.items) }}></div>

                            <Step icon="fa-clipboard-check" label="Sent" active={true} />
                            <Step icon="fa-fire-burner" label="Cooking" active={['accepted', 'preparing', 'ready', 'served'].includes(order.status)} />
                            <Step 
                                icon="fa-bell-concierge" 
                                label={order.status === 'served' ? 'Served' : 'Ready'} 
                                active={order.items?.every(item => ['ready', 'served'].includes(item.status)) || order.status === 'served'} 
                            />
                        </div>

                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                            {item.modifiers?.length > 0 && (
                                                <div className="text-[10px] text-gray-500">{item.modifiers.map(m => m.name).join(', ')}</div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Item Status badges */}
                                    {item.status === 'ready' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Ready</span>}
                                    {item.status === 'served' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Served</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper Components
const Step = ({ icon, label, active }) => (
    <div className="flex flex-col items-center gap-1 bg-white px-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${active ? 'bg-green-500 text-white shadow-md scale-110' : 'bg-gray-200 text-gray-400'}`}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <span className={`text-[10px] font-bold ${active ? 'text-green-600' : 'text-gray-300'}`}>{label}</span>
    </div>
);

const StatusBadge = ({ status, items }) => {
    // Kiểm tra nếu tất cả items đều ready hoặc served
    const allReadyOrServed = items?.every(item => ['ready', 'served'].includes(item.status));
    
    // Nếu tất cả món ready/served nhưng order.status chưa phải 'served' → hiển thị READY
    let displayStatus = status;
    if (allReadyOrServed && status !== 'served') {
        displayStatus = 'ready';
    }
    
    const styles = {
        pending: "bg-yellow-100 text-yellow-700",
        accepted: "bg-blue-100 text-blue-700",
        preparing: "bg-orange-100 text-orange-700",
        ready: "bg-green-100 text-green-700",
        served: "bg-gray-100 text-gray-600",
        rejected: "bg-red-100 text-red-700"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[displayStatus] || styles.pending}`}>
            {displayStatus}
        </span>
    );
};

const getProgressWidth = (status, items) => {
    // Kiểm tra xem có món nào đã served chưa
    const hasServedItems = items?.some(item => item.status === 'served');
    const allServed = items?.every(item => item.status === 'served');
    
    switch(status) {
        case 'pending': return '0%';
        case 'accepted': return '33%';
        case 'preparing': return '66%';
        case 'ready': 
            // Nếu có món served hoặc tất cả ready → 100%
            return (hasServedItems || allServed) ? '100%' : '100%';
        case 'served': return '100%';
        default: return '0%';
    }
};