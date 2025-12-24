import api from "./api";

const getAllStaff = async () => {
    const response = await api.get('/staff');
    return response.data;
}

const createStaff = async (data) => {
    const response = await api.post('/staff', data);
    return response.data;
}

const toggleLockStaff = async (id) => {
    const response = await api.patch(`/staff/${id}/lock`);
    return response.data;
}

const deleteStaff = async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
}

export const staffService = {
    getAllStaff,
    createStaff,
    toggleLockStaff,
    deleteStaff
};
