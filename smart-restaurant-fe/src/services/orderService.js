import api from "./api";

const startSession = async (tableToken) => {
    const response = await api.post('/orders/session/start', { tableToken });
    return response.data;
};

const placeOrder = async (data) => {
    // data: { sessionId, items: [...], customerNote }
    const response = await api.post('/orders', data);
    return response.data;
};

const getSessionDetails = async (sessionId) => {
    const response = await api.get(`/orders/session/${sessionId}`);
    return response.data;
};

const requestCheckout = async (sessionId, paymentMethod) => {
    const response = await api.post(`/orders/session/${sessionId}/checkout`, { paymentMethod });
    return response.data;
};

export const orderService = {
    startSession,
    placeOrder,
    getSessionDetails,
    requestCheckout
};