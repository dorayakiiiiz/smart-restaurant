import api from "./api";

const getPendingOrders = async () => {
    return api.get('/waiter/orders?status=pending');
};

const getAcceptedOrders = async () => {
    return api.get('/waiter/orders?status=accepted');
};

const getReadyOrders = async () => {
    return api.get('/waiter/orders?status=ready');
};

// Example: Get multiple statuses at once
// const getMultipleOrders = async () => {
//     return api.get('/waiter/orders?status=pending,accepted');
// };

const acceptOrder = async (orderId) => {
    return api.patch(`/waiter/orders/${orderId}/status`, { status: 'accepted' });
};

const rejectOrder = async (orderId, rejectionReason) => {
    return api.patch(`/waiter/orders/${orderId}/status`, { 
        status: 'rejected',
        rejectionReason 
    });
};

const markAsServed = async (orderId) => {
    return api.patch(`/waiter/orders/${orderId}/serve`);
};

const getTables = async () => {
    return api.get('/waiter/tables');
};

const confirmPayment = async (sessionId) => {
    return api.post(`/waiter/checkout/${sessionId}`);
};

export const waiterService = {
    getPendingOrders,
    getAcceptedOrders,
    getReadyOrders,
    acceptOrder,
    rejectOrder,
    markAsServed,
    getTables,
    confirmPayment
};