import api from "./api";

const getIncomingOrders = async () => {
    return api.get('/kitchen/orders');
};

const updateOrderStatus = async (orderId, status) => {
    return api.patch(`/kitchen/orders/${orderId}/status`, { status });
};

// update status của từng Item trong Order
const updateItemStatus = async (orderId, itemId, status) => {
    return api.patch(`/kitchen/orders/${orderId}/status`, { itemId, status });
};

const getHistory = async () => {
    return api.get('/kitchen/history');
};

export const kitchenService = {
    getIncomingOrders,
    updateOrderStatus,
    updateItemStatus, // Export it
    getHistory
};