import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { socket } from "../../../services/socket";
import { waiterService } from "../../../services/waiterService";
import Button from "../../../components/Shared/Button";

// Components
import FilterModal from "./components/FilterModal";
import RejectModal from "./components/RejectModal";
import OrderDetailModal from "./components/OrderDetailModal";
import OrdersTable from "./components/OrdersTable";

// Utils
import { 
    filterOrders, 
    calculateTabCounts, 
    getUniqueTables 
} from "../../../utils/helper";

// ============ SUB-COMPONENTS ============
const HeaderSection = ({ onOpenKDS }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold font-momo text-[#1a1a1a]">Orders</h1>
            <p className="text-gray-500">Manage and track all orders in real-time</p>
        </div>
        <Button 
            backgrond={{ normal: "#1a1a1a", hover: "#333" }} 
            color="#fff" 
            text={<><i className="fa-solid fa-tv mr-2"></i>Open KDS</>} 
            onClick={onOpenKDS} 
        />
    </div>
);

const TabsSection = ({ activeTab, setActiveTab, tabCounts }) => {
    const tabs = [
        { key: "all", label: "All Orders" },
        { key: "received", label: "Received" },
        { key: "preparing", label: "Preparing" },
        { key: "ready", label: "Ready" },
        { key: "completed", label: "Completed" },
    ];

    return (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
                <button 
                    key={tab.key} 
                    onClick={() => setActiveTab(tab.key)} 
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                        activeTab === tab.key 
                            ? "bg-[#1a1a1a] text-white" 
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    {tab.label}
                    {tabCounts[tab.key] > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                            activeTab === tab.key 
                                ? "bg-white text-[#1a1a1a]" 
                                : "bg-gray-100 text-gray-600"
                        }`}>
                            {tabCounts[tab.key]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

const SearchAndFilterSection = ({ 
    searchText, 
    setSearchText, 
    onOpenFilter, 
    hasActiveFilters 
}) => (
    <div className="flex gap-4 mb-8 flex-wrap">
        <div className="flex-1 min-w-[200px]">
            <div className="relative">
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                    type="text" 
                    placeholder="Search by order ID or table..." 
                    value={searchText} 
                    onChange={(e) => setSearchText(e.target.value)} 
                    className="w-full h-[50px] rounded-xl bg-white pl-10 pr-4 outline-none border border-gray-200 focus:border-[#D4AF37] transition-colors" 
                />
            </div>
        </div>
        <button 
            onClick={onOpenFilter} 
            className="h-[50px] px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors font-bold text-gray-700 flex items-center gap-2"
        >
            <i className="fa-solid fa-filter"></i>
            Filters
            {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>
            )}
        </button>
    </div>
);

const LoadingState = () => (
    <div className="flex items-center justify-center py-20">
        <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-500">Loading orders...</p>
        </div>
    </div>
);

const ErrorState = ({ error, onRetry }) => (
    <div className="flex items-center justify-center py-20">
        <div className="text-center">
            <i className="fa-solid fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p className="text-red-600 font-bold mb-2">Error loading orders</p>
            <p className="text-gray-500 text-sm">{error.message}</p>
            <button 
                onClick={onRetry} 
                className="mt-4 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333]"
            >
                Retry
            </button>
        </div>
    </div>
);

// ============ CUSTOM HOOKS ============
const useSocketSync = (user, queryClient) => {
    useEffect(() => {
        if (!user || !user.restaurantId) return;

        const updateOrderInCache = (updatedOrder) => {
            // Update 'all' tab
            queryClient.setQueryData(['admin-orders', 'all'], (old = []) => {
                const exists = old.find(o => o._id === updatedOrder._id);
                if (exists) {
                    return old.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                }
                return [updatedOrder, ...old];
            });

            // Update specific tabs
            const tabMapping = {
                'pending': 'received',
                'accepted': 'preparing',
                'preparing': 'preparing',
                'ready': 'ready',
                'completed': 'completed',
                'served': 'completed'
            };

            const targetTab = tabMapping[updatedOrder.status];
            if (targetTab) {
                queryClient.setQueryData(['admin-orders', targetTab], (old = []) => {
                    const exists = old.find(o => o._id === updatedOrder._id);
                    if (exists) {
                        return old.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                    }
                    return [updatedOrder, ...old];
                });
            }

            // Remove from other tabs
            Object.values(tabMapping).forEach(tab => {
                if (tab !== targetTab) {
                    queryClient.setQueryData(['admin-orders', tab], (old = []) => {
                        return old ? old.filter(o => o._id !== updatedOrder._id) : [];
                    });
                }
            });
        };

        const handleNewOrder = (order) => updateOrderInCache(order);
        const handleOrderUpdate = (order) => updateOrderInCache(order);

        // Socket listeners
        socket.on("new_order_alert", handleNewOrder);
        socket.on("order_accepted", handleOrderUpdate);
        socket.on("order_rejected", handleOrderUpdate);
        socket.on("kitchen:order_update", handleOrderUpdate);
        socket.on("waiter:order_ready", handleOrderUpdate);
        socket.on("order_served", handleOrderUpdate);
        socket.on("order_completed", handleOrderUpdate);
        socket.on("order_update", handleOrderUpdate);

        return () => {
            socket.off("new_order_alert", handleNewOrder);
            socket.off("order_accepted", handleOrderUpdate);
            socket.off("order_rejected", handleOrderUpdate);
            socket.off("kitchen:order_update", handleOrderUpdate);
            socket.off("waiter:order_ready", handleOrderUpdate);
            socket.off("order_served", handleOrderUpdate);
            socket.off("order_completed", handleOrderUpdate);
            socket.off("order_update", handleOrderUpdate);
        };
    }, [user?.restaurantId, queryClient]);
};

const useOrdersData = (activeTab) => {
    return useQuery({
        queryKey: ['admin-orders', activeTab],
        queryFn: async () => {
            if (activeTab === "all") {
                const res = await waiterService.getAllOrders();
                return res.data.orders || [];
            } else if (activeTab === "received") {
                const res = await waiterService.getPendingOrders();
                return res.data.orders || [];
            } else if (activeTab === "preparing") {
                const res = await waiterService.getAcceptedOrders();
                return res.data.orders || [];
            } else if (activeTab === "ready") {
                const res = await waiterService.getReadyOrders();
                const orders = res.data.orders || [];
                return orders.filter(order => 
                    !order.items?.some(item => 
                        ['preparing', 'pending', 'confirmed'].includes(item.status)
                    )
                );
            } else if (activeTab === "completed") {
                const res = await waiterService.getAllOrders();
                return (res.data.orders || []).filter(o => 
                    ['completed', 'served'].includes(o.status)
                );
            }
            return [];
        }
    });
};

const useOrderMutations = (queryClient) => {
    const acceptMutation = useMutation({
        mutationFn: (orderId) => waiterService.acceptOrder(orderId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    });

    const rejectMutation = useMutation({
        mutationFn: ({ orderId, reason }) => waiterService.rejectOrder(orderId, reason),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    });

    const serveMutation = useMutation({
        mutationFn: async (orderId) => {
            await waiterService.markAsServed(orderId);
            await waiterService.markOrderComplete(orderId);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    });

    return { acceptMutation, rejectMutation, serveMutation };
};

// ============ MAIN COMPONENT ============
export default function OrdersPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // State
    const [activeTab, setActiveTab] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedTable, setSelectedTable] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [customDateStart, setCustomDateStart] = useState("");
    const [customDateEnd, setCustomDateEnd] = useState("");

    // Custom hooks
    useSocketSync(user, queryClient);
    
    // Queries
    const { data: allOrdersForCounts = [] } = useQuery({
        queryKey: ['admin-orders', 'all'],
        queryFn: async () => {
            const res = await waiterService.getAllOrders();
            return res.data.orders || [];
        }
    });

    const { data: allOrders = [], isLoading, error } = useOrdersData(activeTab);
    const { acceptMutation, rejectMutation, serveMutation } = useOrderMutations(queryClient);

    // Handlers
    const handleAccept = (orderId) => acceptMutation.mutate(orderId);
    
    const handleRejectClick = (order) => {
        setSelectedOrder(order);
        setShowRejectModal(true);
    };
    
    const handleRejectConfirm = () => {
        if (!selectedOrder || !rejectionReason.trim()) return;
        rejectMutation.mutate(
            { orderId: selectedOrder._id, reason: rejectionReason },
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setSelectedOrder(null);
                }
            }
        );
    };
    
    const handleServe = (orderId) => serveMutation.mutate(orderId);
    
    const handleViewDetail = (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const resetFilters = () => {
        setSelectedTable("all");
        setDateFilter("all");
        setCustomDateStart("");
        setCustomDateEnd("");
    };

    // Computed values
    const filteredOrders = filterOrders(
        allOrders, 
        searchText, 
        selectedTable, 
        dateFilter, 
        customDateStart, 
        customDateEnd
    );
    
    const tabCounts = calculateTabCounts(allOrdersForCounts);
    const uniqueTables = getUniqueTables(allOrders);
    const hasActiveFilters = selectedTable !== "all" || dateFilter !== "all";

    // Loading & Error states
    if (isLoading) return <LoadingState />;
    if (error) {
        return (
            <ErrorState 
                error={error} 
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })} 
            />
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-quicksand">
            <HeaderSection onOpenKDS={() => navigate('/system/admin/kds')} />
            
            <TabsSection 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                tabCounts={tabCounts} 
            />

            <SearchAndFilterSection 
                searchText={searchText}
                setSearchText={setSearchText}
                onOpenFilter={() => setShowFilterModal(true)}
                hasActiveFilters={hasActiveFilters}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <OrdersTable 
                    orders={filteredOrders}
                    onViewDetail={handleViewDetail}
                    onReject={handleRejectClick}
                    onAccept={handleAccept}
                    onServe={handleServe}
                />
            </div>

            {/* Modals */}
            <FilterModal 
                show={showFilterModal} 
                onClose={() => setShowFilterModal(false)} 
                selectedTable={selectedTable} 
                setSelectedTable={setSelectedTable} 
                dateFilter={dateFilter} 
                setDateFilter={setDateFilter} 
                customDateStart={customDateStart} 
                setCustomDateStart={setCustomDateStart} 
                customDateEnd={customDateEnd} 
                setCustomDateEnd={setCustomDateEnd} 
                uniqueTables={uniqueTables} 
                onApply={() => setShowFilterModal(false)} 
                onReset={resetFilters} 
            />

            <RejectModal 
                show={showRejectModal} 
                order={selectedOrder} 
                reason={rejectionReason} 
                setReason={setRejectionReason} 
                onConfirm={handleRejectConfirm} 
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setSelectedOrder(null);
                }} 
            />

            <OrderDetailModal 
                show={showDetailModal} 
                order={selectedOrder} 
                onClose={() => setShowDetailModal(false)} 
                onReject={handleRejectClick} 
                onAccept={handleAccept} 
                onServe={handleServe} 
            />
        </div>
    );
}
