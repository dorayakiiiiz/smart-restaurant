import api from "./api";

const getMenu = async (restaurantId = null) => {
    if (restaurantId && typeof restaurantId === 'string') {
        // Gọi API Public dành cho khách
        const response = await api.get(`/menu/public/${restaurantId}`);
        return response.data;
    }
    // Gọi API Private dành cho Admin
    const response = await api.get('/menu');
    return response.data;
};

const getMenuItem = async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
};

const createMenuItem = async (formData) => {
    const response = await api.post('/menu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

const updateMenuItem = async (id, formData) => {
    const response = await api.patch(`/menu/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

const deleteMenuItem = async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
};

const deleteMenuImage = async (itemId, imageId) => {
    const response = await api.delete(`/menu/${itemId}/images/${imageId}`);
    return response.data;
};

const setPrimaryImage = async (itemId, imageId) => {
    const response = await api.patch(`/menu/${itemId}/images/${imageId}/primary`);
    return response.data;
};


const getTrashMenu = async () => {
    const response = await api.get('/menu/trash');
    return response.data;
};

const restoreMenuItem = async (id) => {
    const response = await api.patch(`/menu/${id}/restore`);
    return response.data;
};

const forceDeleteMenuItem = async (id) => {
    const response = await api.delete(`/menu/${id}/force`);
    return response.data;
};

export const menuService = {
    getMenu,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    deleteMenuImage,
    setPrimaryImage,
    getTrashMenu,
    restoreMenuItem,
    forceDeleteMenuItem
};