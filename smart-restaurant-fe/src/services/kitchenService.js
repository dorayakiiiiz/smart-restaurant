import api from "./api";

// TODO: Team Member B điền code gọi API vào đây
const getIncomingOrders = async () => {
    // return api.get('/kitchen/orders');
};

const updateItemStatus = async (itemId, status) => {
    // return api.patch(...);
};

export const kitchenService = {
    getIncomingOrders,
    updateItemStatus
};