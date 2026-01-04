import api from "./api";

const getMyRestaurant = async () => {
    const response = await api.get('/restaurant/me');
    return response.data;
}

const createRestaurant = async (formData) => {
    // Dùng formData vì có upload ảnh
    const response = await api.post('/restaurant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
}

const updateRestaurant = async (formData) => {
    const response = await api.patch('/restaurant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
}

const getDashboardStats = async () => {
    const response = await api.get('/restaurant/stats');
    return response.data;
}
const getPublicRestaurant = async (restaurantId) => {
    const response = await api.get(`/restaurant/public/${restaurantId}`);
    return response.data;
}

export const restaurantService = {
    getMyRestaurant,
    createRestaurant,
    updateRestaurant,
    getDashboardStats,
    getPublicRestaurant
};