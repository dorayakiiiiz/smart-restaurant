import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { orderService } from "../../services/orderService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../services/socket";

export default function OrderTrackingPage() {
    const { sessionInfo } = useCart();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [waitingForWaiter, setWaitingForWaiter] = useState(false);
    const [discountInfo, setDiscountInfo] = useState({ percentage: 0, amount: 0, finalAmount: 0 }); // State mới cho cash

    // Helper function to calculate discount (same logic as CartPage)
    const calculateDiscount = (subtotal) => {
        if (subtotal >= 200) return { percentage: 15, amount: subtotal * 0.15 };
        if (subtotal >= 100) return { percentage: 10, amount: subtotal * 0.10 };
        if (subtotal >= 50) return { percentage: 5, amount: subtotal * 0.05 };
        return { percentage: 0, amount: 0 };
    };
   
    // Thay thế useState/useEffect bằng useQuery
    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ['customer-orders', sessionInfo?.session?._id],
        queryFn: async () => {
            if (!sessionInfo?.session?._id) return [];
            const res = await orderService.getSessionDetails(sessionInfo.session._id);
            return res.orders || [];
        },
        enabled: !!sessionInfo?.session?._id
    });


    useEffect(() => {
        if (!sessionInfo?.session?._id) return;

        // Socket đã được join room session ở CartContext
        
        // Backend bắn sự kiện chung 'order_update' cho Customer mỗi khi trạng thái thay đổi
        const handleOrderUpdate = (updatedOrder) => {
            queryClient.setQueryData(['customer-orders', sessionInfo.session._id], (oldData) => {
                if (!oldData) return [updatedOrder];

                const exists = oldData.find(o => o._id === updatedOrder._id);
                if (exists) {
                    // Update trạng thái (VD: Pending -> Preparing -> Ready)
                    return oldData.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                } else {
                    // Trường hợp hiếm: Order mới được tạo từ thiết bị khác cùng bàn
                    return [updatedOrder, ...oldData];
                }
            });
        };

        socket.on("order_update", handleOrderUpdate);

        return () => {
            socket.off("order_update", handleOrderUpdate);
        };
    }, [sessionInfo?.session?._id, queryClient]);

    const handleCheckout = async (method) => {
        setIsProcessing(true);
        try {
            const res = await orderService.requestCheckout(sessionInfo.session._id, method);
            
            if (res.discountPercentage !== undefined) {
                setDiscountInfo({
                    percentage: res.discountPercentage || 0,
                    amount: res.discountAmount || 0,
                    finalAmount: res.finalAmount || res.totalAmount || sessionTotal
                });
            }
            
            if (method === 'transfer' && res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else if (method === 'cash') {
                setShowPaymentModal(false);
                setWaitingForWaiter(true);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to request checkout");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Orders...</div>;

    // Tính tổng tiền session
    const sessionTotal = orders.reduce((acc, order) => {
        if (order.status === 'rejected') return acc;
        return acc + order.items.reduce((itemAcc, item) => {
            const modPrice = item.modifiers?.reduce((m, mod) => m + (mod.price || 0), 0) || 0;
            return itemAcc + (item.price + modPrice) * item.quantity;
        }, 0);
    }, 0);

    // Calculate discount preview (before user clicks Request Bill)
    const discountPreview = calculateDiscount(sessionTotal);
    const finalTotalPreview = sessionTotal - discountPreview.amount;

    // Use actual discount from API if available (after Request Bill), otherwise use preview
    const displayDiscount = discountInfo.percentage > 0 ? discountInfo : discountPreview;
    const displayFinalAmount = discountInfo.finalAmount > 0 ? discountInfo.finalAmount : finalTotalPreview;

    // UI khi đang chờ Waiter thu tiền mặt
    // if (waitingForWaiter) {
    //     return (
    //         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
    //             <div className="bg-[#1a1a1a] border border-amber-900/30 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 max-w-sm w-full text-center relative">
    //                 <div className="absolute top-2 left-2 w-8 h-8 border-t border-l border-amber-600/50"></div>
    //                 <div className="absolute bottom-2 right-2 w-8 h-8 border-b border-r border-amber-600/50"></div>
    //                 <div className="mb-8">
    //                     <div className="w-20 h-20 mx-auto border border-amber-600/30 rounded-full flex items-center justify-center bg-gradient-to-b from-amber-500/10 to-transparent">
    //                         <i className="fa-solid fa-bell-concierge text-3xl text-amber-500"></i>
    //                     </div>
    //                 </div>
    //                 <h2 className="text-xl font-serif text-amber-500 uppercase tracking-[0.2em] mb-4">
    //                     Please Wait
    //                 </h2>
    //                 <div className="h-[1px] w-12 bg-amber-600/30 mx-auto mb-6"></div>
    //                 <p className="text-gray-400 font-light leading-relaxed mb-8">
    //                     Our staff has been notified. 
    //                     <br />
    //                     Total amount due: 
    //                     <span className="block text-2xl font-serif text-white mt-2">
    //                         ${sessionTotal.toLocaleString()}
    //                     </span>
    //                 </p>
    //                 <div className="flex flex-col items-center gap-4">
    //                     <div className="flex gap-2">
    //                         <span className="w-1 h-1 bg-amber-600 rounded-full animate-pulse"></span>
    //                         <span className="w-1 h-1 bg-amber-600 rounded-full animate-pulse delay-75"></span>
    //                         <span className="w-1 h-1 bg-amber-600 rounded-full animate-pulse delay-150"></span>
    //                     </div>
    //                     <span className="text-[10px] uppercase tracking-[0.3em] text-amber-600/80 font-medium">
    //                         Staff Attending
    //                     </span>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }
    if (waitingForWaiter) {
        const displayAmount = discountInfo.finalAmount > 0 ? discountInfo.finalAmount : sessionTotal;
        const hasDiscount = discountInfo.percentage > 0;
        
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center p-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-900/20 rounded-full blur-[120px]"></div>
                
                <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
                        <div className="relative w-full h-full bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/40">
                            <i className="fa-solid fa-hand-holding-dollar text-4xl text-black/80"></i>
                        </div>
                    </div>

                    <h2 className="text-3xl font-light tracking-tight text-white mb-3">
                        Waiting for <span className="font-semibold text-amber-500">Waiter</span>
                    </h2>
                    
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        {hasDiscount && (
                            <>
                                <span className="block text-sm line-through text-zinc-500">
                                    ${sessionTotal.toFixed(2)}
                                </span>
                                <span className="block text-xs text-[#D4AF37] mb-2">
                                    Discount {discountInfo.percentage}% applied
                                </span>
                            </>
                        )}
                        Please prepare <br />
                        <span className="text-2xl font-mono font-bold text-white tracking-wider">
                            ${displayAmount.toFixed(2)}
                        </span> 
                        <span className="block text-xs uppercase tracking-[0.2em] mt-1 text-amber-500/70">In Cash</span>
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-medium">
                            Staff Notified
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pb-32">
            {/* Header Summary */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <h2 className="text-gray-400 text-sm mb-1">Current Session</h2>
                
                {displayDiscount.percentage > 0 ? (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Subtotal</span>
                            <span className="text-white font-semibold">${sessionTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[#D4AF37] text-sm flex items-center gap-1">
                                Discount ({displayDiscount.percentage}%)
                            </span>
                            <span className="text-[#D4AF37] font-semibold">${displayDiscount.amount.toFixed(2)}</span>
                        </div>
                        <div className="font-momo font-bold text-4xl text-[#D4AF37] mb-4">
                            ${displayFinalAmount.toFixed(2)}
                        </div>
                    </>
                ) : (
                    <div className="font-momo font-bold text-4xl text-[#D4AF37] mb-4">
                        ${sessionTotal.toFixed(2)}
                    </div>
                )}
                
                <button 
                    onClick={() => setShowPaymentModal(true)}
                    disabled={sessionTotal === 0}
                    className="w-full py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition"
                >
                    Request Bill & Pay
                </button>
            </div>

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/60  flex items-end md:items-center justify-center"
                    onClick={() => setShowPaymentModal(false)}
                >
                    
                    
                    {/* Modal Bottom Sheet */}
                    <div 
                        className="relative bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        
                        {/* Thanh Handle cho Mobile */}
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

                        <div className="pt-6 pb-2 px-6">
                            <h3 className="text-xl font-bold text-gray-800 text-center">Select Payment Method</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Bank Transfer / QR */}
                            <button 
                                onClick={() => handleCheckout('transfer')}
                                disabled={isProcessing}
                                className="group w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:border-blue-500 hover:shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <i className="fa-solid fa-qrcode text-xl"></i>
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-gray-800 text-sm">Bank Transfer / QR</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Instant confirmation via PayOS</div>
                                </div>
                                <i className="fa-solid fa-chevron-right text-gray-200 group-hover:text-blue-500 transition-colors text-xs"></i>
                            </button>

                            {/* Cash */}
                            <button 
                                onClick={() => handleCheckout('cash')}
                                disabled={isProcessing}
                                className="group w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:border-green-500 hover:shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                                    <i className="fa-solid fa-money-bill-wave text-xl"></i>
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-gray-800 text-sm">Cash</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Pay directly to waiter</div>
                                </div>
                                <i className="fa-solid fa-chevron-right text-gray-200 group-hover:text-green-500 transition-colors text-xs"></i>
                            </button>
                        </div>

                        {/* Cancel Button */}
                        <div className="px-6 pb-8 md:pb-6">
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full py-4 text-gray-500 font-semibold hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes slide-up {
                            from { transform: translateY(100%); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                        .animate-slide-up {
                            animation: slide-up 0.3s ease-out;
                        }
                    `}} />
                </div>
            )}

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