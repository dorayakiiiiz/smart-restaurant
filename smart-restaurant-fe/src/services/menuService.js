import api from "./api";

const getMenu = async () => {
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

export const menuService = {
    getMenu,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};