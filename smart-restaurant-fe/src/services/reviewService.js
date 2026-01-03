import api from "./api";

const getReviews = async (restaurantId, itemId) => {
    const response = await api.get(`/reviews/${restaurantId}/item/${itemId}`);
    return response.data.reviews;
};

// Thêm method mới
const getRestaurantReviews = async (restaurantId) => {
    const response = await api.get(`/reviews/${restaurantId}/restaurant`);
    return response.data.reviews;
};

const addReview = async (data) => {
    const response = await api.post('/reviews', data);
    return response.data;
};

const updateReview = async (id, data) => {
    const response = await api.patch(`/reviews/${id}`, data);
    return response.data;
};

const deleteReview = async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
};

export const reviewService = {
    getReviews,
    getRestaurantReviews, 
    addReview,
    updateReview,
    deleteReview
};