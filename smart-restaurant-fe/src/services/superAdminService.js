import api from "./api";

const getAllAdmins = async () => {
    const response = await api.get('/super/admin');
    return response.data;
}

const createAdmin = async (data) => {
    const response = await api.post('/super/admin', data);
    return response.data;
}

const updateAdmin = async (id, data) => {
    const response = await api.patch(`/super/admin/${id}`, data);
    return response.data;
}

const deleteAdmin = async (id) => {
    const response = await api.delete(`/super/admin/${id}`);
    return response.data;
}

//Filter: week, month, year
const getSystemStats = async (filter = 'week') => {
    const response = await api.get(`/super/admin/stats?filter=${filter}`);
    return response.data;
}

const toggleLockAdmin = async (userId) => {
    const response = await api.patch(`/super/admin/${userId}/lock`);
    return response.data;
}

export const superAdminService = {
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getSystemStats,
    toggleLockAdmin
};