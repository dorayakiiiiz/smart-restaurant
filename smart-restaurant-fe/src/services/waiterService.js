import api from "./api";

// TODO: Team Member A điền code gọi API vào đây
const getPendingOrders = async () => {
    // return api.get('/waiter/orders');
};

const updateOrderStatus = async (id, status) => {
    // return api.patch(...);
};

export const waiterService = {
    getPendingOrders,
    updateOrderStatus
};