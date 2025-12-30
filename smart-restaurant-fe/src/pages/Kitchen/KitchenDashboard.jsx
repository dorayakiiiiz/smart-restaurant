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
import RecycleBinModal from "./Components/RecycleBinModal";
import { useRef } from "react";

export default function KitchenDashboard() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showHistory, setShowHistory] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const audioRef = useRef(new Audio('/cheerful-trombone-and-trumpet-march-432177.mp3'));
    const soundRef = useRef(true);
    const stopTimerRef = useRef(null);

    useEffect(() => {
        soundRef.current = isSoundEnabled;
    }, [isSoundEnabled]);

    useEffect(() => {
        return () => {
            if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
            audioRef.current.pause();
        };
    }, []);

    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['kitchenOrders'],
        queryFn: async () => {
            const res = await kitchenService.getIncomingOrders();
            return Array.isArray(res.data) ? res.data : [];
        },
    });

    const { data: historyOrders = [], refetch: refetchHistory } = useQuery({
        queryKey: ['kitchenHistory'],
        queryFn: async () => {
            const res = await kitchenService.getHistory();
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: showHistory,
    });

    const acceptOrderMutation = useMutation({
        mutationFn: (orderId) => kitchenService.updateOrderStatus(orderId, 'preparing'),
        onSuccess: () => {
            queryClient.invalidateQueries(['kitchenOrders']);
        }
    });

    const finishOrderMutation = useMutation({
        mutationFn: (orderId) => kitchenService.updateOrderStatus(orderId, 'ready'),
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

    const recallOrderMutation = useMutation({
        mutationFn: (orderId) => kitchenService.updateOrderStatus(orderId, 'preparing'),
        onSuccess: () => {
            queryClient.invalidateQueries(['kitchenOrders']);
            queryClient.invalidateQueries(['kitchenHistory']);
            setShowHistory(false);
        }
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user?.restaurantId) {
            console.warn("⚠️ KitchenDashboard: User missing restaurantId", user);
            return;
        }

        console.log("🔌 KitchenDashboard: Initializing socket...");

        if (!socket.connected) {
            socket.connect();
        }

        const joinRoom = () => {
            console.log(`🚀 Emitting join_kitchen for restaurant: ${user.restaurantId}`);
            socket.emit('join_kitchen', user.restaurantId);
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.on('connect', joinRoom);
        }

        const handleRefetch = (data) => {
            console.log('🔔 Socket event received:', data);
            queryClient.invalidateQueries(['kitchenOrders']);
            playNotificationSound();
        };

        socket.on('order_accepted', handleRefetch);
        socket.on('kitchen:order_update', handleRefetch);

        return () => {
            socket.off('connect', joinRoom);
            socket.off('order_accepted', handleRefetch);
            socket.off('kitchen:order_update', handleRefetch);
        };
    }, [user?.restaurantId, queryClient]);

    const playNotificationSound = () => {
        if (!soundRef.current) return;

        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
        }

        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                stopTimerRef.current = setTimeout(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    console.log("⏱️ Nhạc đã dừng sau 3s");
                }, 3000);
            }).catch(error => {
                console.warn("🔇 Trình duyệt chặn tự động phát nhạc:", error);
            });
        }
    };

    const toggleSound = () => {
        const newStatus = !isSoundEnabled;
        setIsSoundEnabled(newStatus);
        
        if (!newStatus) {
            if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const stats = {
        pending: orders.filter(o => o.status === 'accepted').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        overdue: orders.filter(o => {
            if (o.status !== 'preparing' || !o.preparingAt) return false;
            const maxPrepTime = Math.max(...o.items.map(i => i.prepTime || 15));
            const elapsedMinutes = (currentTime - new Date(o.preparingAt)) / 1000 / 60;
            return elapsedMinutes > maxPrepTime;
        }).length,
    };

    return (
        <div className="flex flex-col h-screen bg-[#0a0c10] text-gray-100 font-sans overflow-hidden selection:bg-amber-500 selection:text-black">
            
            {/* === HEADER BAR === */}
            <header className="h-[70px] md:h-[80px] bg-gradient-to-r from-[#12151c] via-[#1a1e28] to-[#12151c] border-b border-gray-800/50 flex items-center justify-between px-3 md:px-4 lg:px-8 shadow-2xl z-20 shrink-0 relative overflow-hidden">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                {/* LEFT: Logo */}
                <div className="flex items-center gap-2 md:gap-4 relative z-10">
                    <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-white/10">
                            <i className="fa-solid fa-fire-burner text-white text-lg md:text-2xl drop-shadow-lg"></i>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-[#12151c] animate-pulse"></div>
                    </div>
                    <div className="">
                        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 leading-none font-momo tracking-tight">
                            KDS
                        </h1>
                        <span className="text-gray-500 font-bold font-quicksand">Kitchen Display System</span>
                    </div>
                </div>

                {/* CENTER: Stats Bar (Desktop LG+) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex">
                    <div className="flex items-center bg-[#0a0c10]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
                        <StatItem label="PENDING" count={stats.pending} color="text-amber-500" animate={stats.pending > 0} />
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-2"></div>
                        <StatItem label="COOKING" count={stats.preparing} color="text-blue-500" />
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-2"></div>
                        <StatItem label="READY" count={stats.ready} color="text-emerald-500" />
                        <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-2"></div>
                        <StatItem label="LATE" count={stats.overdue} color="text-red-500" animate={stats.overdue > 0} />
                    </div>
                </div>

                {/* RIGHT: Controls & Time */}
                <div className="flex items-center gap-2 md:gap-5 relative z-10">
                    {/* Time Display */}
                    <div className="text-right">
                        <div className="text-xl md:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 leading-none tracking-wider">
                            {formatTime(currentTime)}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent hidden xl:block"></div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <button 
                            onClick={toggleSound}
                            className={`
                                w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
                                ${isSoundEnabled 
                                    ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 hover:from-emerald-500/30 hover:to-green-600/30 shadow-lg shadow-emerald-500/10' 
                                    : 'bg-gray-800/50 text-gray-500 hover:bg-gray-800'
                                }
                            `}
                            title={isSoundEnabled ? "Mute Sound" : "Enable Sound"}
                        >
                            <i className={`fa-solid text-sm md:text-lg ${isSoundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                        </button>

                        <button 
                            onClick={() => setShowHistory(true)}
                            className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white flex items-center justify-center transition-all duration-300 shrink-0 hover:border-gray-600"
                            title="View History"
                        >
                            <i className="fa-solid fa-clock-rotate-left text-sm md:text-lg"></i>
                        </button>

                        <button 
                            onClick={logout}
                            className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-red-500/20 text-red-500 hover:from-red-500/20 hover:to-rose-600/20 flex items-center justify-center transition-all duration-300 shrink-0"
                            title="Logout"
                        >
                            <i className="fa-solid fa-power-off text-sm md:text-lg"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* === TABLET STATS BAR (MD only) === */}
            <div className="flex lg:hidden bg-gradient-to-r from-[#12151c] to-[#1a1e28] border-b border-gray-800/50 justify-center z-10 shadow-lg">
                <div className="flex items-center justify-around w-full px-4 md:px-6">
                    <StatItem label="PENDING" count={stats.pending} color="text-amber-500" animate={stats.pending > 0} />
                    <div className="w-px h-8 md:h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
                    <StatItem label="COOKING" count={stats.preparing} color="text-blue-500" />
                    <div className="w-px h-8 md:h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
                    <StatItem label="READY" count={stats.ready} color="text-emerald-500" />
                    <div className="w-px h-8 md:h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
                    <StatItem label="LATE" count={stats.overdue} color="text-red-500" animate={stats.overdue > 0} />
                </div>
            </div>

            {/* === MAIN BOARD === */}
            <main className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden relative">
                
                {/* Background with gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c10] via-[#0d1017] to-[#0a0c10]"></div>
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}></div>

                {/* Loading Overlay */}
                {loadingOrders && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0c10]/90 z-50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm">Loading Orders...</span>
                        </div>
                    </div>
                )}

                {/* Columns Grid - FIXED: Always 3 columns on md+ */}
                <div className="flex h-full gap-2 md:gap-4 lg:gap-6 relative z-10">
                    
                    {/* COLUMN: RECEIVED */}
                    <Column 
                        title="RECEIVED" 
                        count={stats.pending} 
                        color="amber" 
                        icon={<FaBell />}
                    >
                        {orders.filter(o => o.status === 'accepted').map(order => (
                            <OrderCard 
                                key={order._id || order.id} 
                                order={order} 
                                type="accepted"
                                onAction={() => acceptOrderMutation.mutate(order._id || order.id)}
                            />
                        ))}
                    </Column>

                    {/* COLUMN: PREPARING */}
                    <Column 
                        title="COOKING" 
                        count={stats.preparing} 
                        color="blue" 
                        icon={<FaFire />}
                    >
                        {orders.filter(o => o.status === 'preparing').map(order => (
                            <OrderCard 
                                key={order._id || order.id} 
                                order={order} 
                                type="preparing"
                                onAction={() => finishOrderMutation.mutate(order._id || order.id)}
                                onItemAction={(itemId, status) => updateItemStatusMutation.mutate({ orderId: order._id || order.id, itemId, status })}
                            />
                        ))}
                    </Column>

                    {/* COLUMN: READY */}
                    <Column 
                        title="READY" 
                        count={stats.ready} 
                        color="emerald" 
                        icon={<FaCheckCircle />}
                    >
                        {orders.filter(o => o.items.some(i => i.status === 'ready')).map(order => (
                            <OrderCard 
                                key={order._id || order.id} 
                                order={order} 
                                type="ready"
                                onItemAction={(itemId, status) => updateItemStatusMutation.mutate({ orderId: order._id || order.id, itemId, status })}
                            />
                        ))}
                    </Column>
                </div>
            </main>

            {/* === RECYCLE BIN MODAL === */}
            <RecycleBinModal 
                show={showHistory} 
                onClose={() => setShowHistory(false)} 
                historyOrders={historyOrders} 
                onRecall={(orderId) => recallOrderMutation.mutate(orderId)} 
            />
        </div>
    );
}

