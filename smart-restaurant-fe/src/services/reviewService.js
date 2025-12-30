import api from "./api";

export const reviewService = {
    getReviews: async (menuItemId) => {
        const response = await api.get(`/reviews/${menuItemId}`);
        return response.data;
    },
    addReview: async (data) => {
        const response = await api.post("/reviews", data);
        return response.data;
    },
    updateReview: async (id, data) => {
        const response = await api.put(`/reviews/${id}`, data);
        return response.data;
    },
    deleteReview: async (id) => {
        const response = await api.delete(`/reviews/${id}`);
        return response.data;
    }
};