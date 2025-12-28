import api from "./api";

const getCategories = async (restaurantId = null) => {
    if (restaurantId) {
        // Gọi API Public dành cho khách
        const response = await api.get(`/categories/public/${restaurantId}`);
        return response.data;
    }
    // Gọi API Private dành cho Admin
    const response = await api.get('/categories');
    return response.data;
};

//data là object { name: "Category Name" }
const createCategory = async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
};

const deleteCategory = async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

// data: { name, description, order, isActive }
const updateCategory = async (id, data) => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
};


const forceDeleteCategory = async (id) => {
    const response = await api.delete(`/categories/${id}/force`);
    return response.data;
};

const restoreCategory = async (id) => {
    const response = await api.patch(`/categories/${id}/restore`);
    return response.data;
};

const getTrashCategories = async () => {
    const response = await api.get('/categories/trash');
    return response.data;
};


export const categoryService = {
    getCategories,
    createCategory,
    deleteCategory,
    updateCategory,
    forceDeleteCategory,
    restoreCategory,
    getTrashCategories,
};