import api from "./api";

const getIncomingOrders = async () => {
    return api.get('/kitchen/orders');
};

const updateOrderStatus = async (orderId, status) => {
    // URL này sẽ match với /api/kitchen/orders/:orderId/status
    return api.patch(`/kitchen/orders/${orderId}/status`, { status });
};

// update status của từng Item trong Order
const updateItemStatus = async (orderId, itemId, status) => {
    // URL này sẽ match với /api/kitchen/orders/:orderId/status
    // itemId được gửi trong body
    return api.patch(`/kitchen/orders/${orderId}/status`, { itemId, status });
};

// Lấy lịch sử đơn hàng đã hoàn thành
const getHistory = async () => {
    return api.get('/kitchen/history');
};

export const kitchenService = {
    getIncomingOrders,
    updateOrderStatus,
    updateItemStatus,
    getHistory
};