import api from "./api";

export const reviewService = {
    getReviews: async (restaurantId, menuItemId) => {
        const response = await api.get(`/reviews/${restaurantId}/${menuItemId}`);
        return response.data;
    },
    addReview: async (data) => {
        const response = await api.post("/reviews", data);
        return response.data;
    },
    //id ở đây là id của review cần sửa
    updateReview: async (id, data) => {
        const response = await api.put(`/reviews/${id}`, data);
        return response.data;
    },
    deleteReview: async (id) => {
        const response = await api.delete(`/reviews/${id}`);
        return response.data;
    }
};