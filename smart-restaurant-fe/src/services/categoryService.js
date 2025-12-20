import api from "./api";

const getCategories = async () => {
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

const updateCategory = async (id, name) => {
    const response = await api.patch(`/categories/${id}`, { name });
    return response.data;
};


export const categoryService = {
    getCategories,
    createCategory,
    deleteCategory,
    updateCategory,
};