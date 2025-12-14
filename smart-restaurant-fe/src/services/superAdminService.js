import api from "./api";

const getAllAdmins = async () => {
    const response = await api.get('/system/admin');
    return response.data;
}

const createAdmin = async (data) => {
    const response = await api.post('/system/admin', data);
    return response.data;
}

const deleteAdmin = async (id) => {
    const response = await api.delete(`/system/admin/${id}`);
    return response.data;
}

const getSystemStats = async () => {
    const response = await api.get('/system/admin/stats');
    return response.data;
}

const toggleLockAdmin = async (userId) => {
    const response = await api.patch(`/system/admin/${userId}/lock`);
    return response.data;
}

export const superAdminService = {
    getAllAdmins,
    createAdmin,
    getSystemStats,
    toggleLockAdmin
};