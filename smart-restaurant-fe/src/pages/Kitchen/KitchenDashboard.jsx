import React, { useState, useEffect } from "react";
import { 
    FaClock, 
    FaCheckCircle, 
    FaFire, 
    FaBell, 
    FaUtensils, 
    FaCog, 
    FaSignOutAlt, 
    FaVolumeUp,
    FaExclamationTriangle,
    FaUndo,
    FaHistory,
    FaTimes,
    FaCheckSquare,
    FaSquare
} from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kitchenService } from "../../services/kitchenService";
import { socket } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import OrderCard from "./Components/OrderCard";
import Column from "./Components/Column";
import StatItem from "./Components/StatItem";
import RecycleBinModal from "./Components/RecyckeBinModal";

export default function KitchenDashboard() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showHistory, setShowHistory] = useState(false);

    // --- Queries ---

    //orders
    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['kitchenOrders'],
        queryFn: async () => {
            const res = await kitchenService.getIncomingOrders();
            return Array.isArray(res.data) ? res.data : [];
        },
        // tự động gọi lại API mỗi 5 giây để cập nhật đơn hàng mới
        refetchInterval: 5000, // Fallback polling every 30s
    });

    //history orders
    const { data: historyOrders = [], refetch: refetchHistory } = useQuery({
        queryKey: ['kitchenHistory'],
        queryFn: async () => {
            const res = await kitchenService.getHistory();
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: showHistory, // Only fetch when modal is open
    });

    // --- Mutations ---

    const acceptOrderMutation = useMutation({
        //Chuyển sang preparing
        mutationFn: (orderId) => kitchenService.updateOrderStatus(orderId, 'preparing'),
        onSuccess: () => {
            queryClient.invalidateQueries(['kitchenOrders']);
        }
    });

    const updateItemStatusMutation = useMutation({
        mutationFn: ({ orderId, itemId, status }) => kitchenService.updateItemStatus(orderId, itemId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['kitchenOrders']);
            if (variables.status === 'served') {
                queryClient.invalidateQueries(['kitchenHistory']);
            }
        }
    });

    //Xem lại logic recall
    //To do
    const recallOrderMutation = useMutation({
        mutationFn: (orderId) => kitchenService.updateOrderStatus(orderId, 'preparing'),
        onSuccess: () => {
            queryClient.invalidateQueries(['kitchenOrders']);
            queryClient.invalidateQueries(['kitchenHistory']);
            setShowHistory(false);
        }
    });

    // --- Effects ---

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    
    //kết nối socket khi component mount
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    
    //kết nối socket khi component mount
    useEffect(() => {
        if (!user?.restaurantId) {
            console.warn("⚠️ KitchenDashboard: User missing restaurantId", user);
            return;
        }

        console.log("🔌 KitchenDashboard: Initializing socket...");

        if (!socket.connected) {
            socket.connect();
        }

        // Hàm join room an toàn
        const joinRoom = () => {
            console.log(`🚀 Emitting join_kitchen for restaurant: ${user.restaurantId}`);
            socket.emit('join_kitchen', user.restaurantId);
        };

        // Nếu đã connect rồi thì join luôn, chưa thì đợi event 'connect'
        if (socket.connected) {
            joinRoom();
        } else {
            socket.on('connect', joinRoom);
        }

        //data ở đây là socket bên BE gửi
        const handleRefetch = (data) => {
            console.log('🔔 Socket event received:', data);
            queryClient.invalidateQueries(['kitchenOrders']);
            // playNotificationSound();
        };

        // Listen to events
        socket.on('order_accepted', handleRefetch); // From Waiter
        socket.on('kitchen:order_update', handleRefetch); // From Kitchen (sync)
        socket.on('kitchen:new_order', handleRefetch); // Legacy/Backup

        return () => {
            socket.off('connect', joinRoom);
            socket.off('order_accepted', handleRefetch);
            socket.off('kitchen:order_update', handleRefetch);
            socket.off('kitchen:new_order', handleRefetch);
            // socket.disconnect(); // Tạm thời comment để tránh ngắt kết nối nếu component re-render nhanh
        };
    }, [user?.restaurantId, queryClient]); // Chỉ chạy lại khi restaurantId thay đổi

    // --- Actions ---

    const playNotificationSound = () => {
        // const audio = new Audio('/sounds/bell.mp3');
        // audio.play();
    };

    // --- Helpers ---

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Stats
    const stats = {
        pending: orders.filter(o => o.status === 'accepted').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        overdue: orders.filter(o => {
            const elapsed = (new Date() - new Date(o.createdAt)) / 1000 / 60;
            // Quá 15 phút và chưa sẵn sàng 
            return elapsed > 15 && o.status !== 'ready';
        }).length,
    };

    return (
        <div className="flex flex-col h-screen bg-[#111827] text-white font-inter overflow-hidden">
            
            {/* --- HEADER --- */}
            <header className="h-20 bg-[#1F2937] border-b border-gray-700 flex items-center justify-between px-6 shadow-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                        <FaUtensils className="text-2xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Kitchen Display</h1>
                        <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Smart Restaurant System</p>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex bg-[#111827] rounded-xl p-1.5 border border-gray-700 shadow-inner">
                    <StatItem label="PENDING" count={stats.pending} color="text-amber-500" />
                    <div className="w-px bg-gray-700 mx-2 h-8 self-center"></div>
                    <StatItem label="PREPARING" count={stats.preparing} color="text-blue-500" />
                    <div className="w-px bg-gray-700 mx-2 h-8 self-center"></div>
                    <StatItem label="READY" count={stats.ready} color="text-emerald-500" />
                    <div className="w-px bg-gray-700 mx-2 h-8 self-center"></div>
                    <StatItem label="OVERDUE" count={stats.overdue} color="text-rose-500" animate={stats.overdue > 0} />
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-3xl font-mono font-bold text-gray-200 tracking-widest leading-none">
                            {formatTime(currentTime)}
                        </div>
                    </div>
                    
                    {/* 3 ô setting ở trên */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white"
                        >
                            <FaHistory />
                            <span>Recycle Bin</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/20">
                            <FaVolumeUp />
                            <span>Sound ON</span>
                        </button>
                        <button 
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-rose-500/10 text-rose-400 border border-rose-500/50 hover:bg-rose-500/20"
                        >
                            <FaSignOutAlt />
                            <span>Exit</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* --- MAIN BOARD --- */}
            <main className="flex-1 p-6 overflow-hidden flex gap-6 relative">
                
                {loadingOrders && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/80 z-50">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {/* COLUMN: RECEIVED (Pending Orders) */}
                <Column 
                    title="RECEIVED" 
                    count={stats.pending} 
                    color="amber" //Sửa màu ở đây
                    icon={<FaBell />}
                >
                    {orders.filter(o => o.status === 'accepted').map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            type="accepted"
                            onAction={() => acceptOrderMutation.mutate(order.id)}
                        />
                    ))}
                </Column>

                {/* COLUMN: PREPARING (Cooking Items) */}
                <Column 
                    title="PREPARING" 
                    count={stats.preparing} 
                    color="blue" 
                    icon={<FaFire />}
                >
                    {orders.filter(o => o.status === 'preparing').map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            type="preparing"
                            onItemAction={(itemId, status) => updateItemStatusMutation.mutate({ orderId: order.id, itemId, status })}
                        />
                    ))}
                </Column>

                {/* COLUMN: READY (Ready Items) */}
                <Column 
                    title="READY" 
                    count={stats.ready} 
                    color="emerald" 
                    icon={<FaCheckCircle />}
                >
                    {orders.filter(o => o.items.some(i => i.status === 'ready')).map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            type="ready"
                            onItemAction={(itemId, status) => updateItemStatusMutation.mutate({ orderId: order.id, itemId, status })}
                        />
                    ))}
                </Column>

            </main>

            {/* --- RECYCLE BIN MODAL --- */}
            <RecycleBinModal 
                show={showHistory} 
                onClose={() => setShowHistory(false)} 
                historyOrders={historyOrders} 
                onRecall={(orderId) => recallOrderMutation.mutate(orderId)} 
            />
        </div>
    );
}

