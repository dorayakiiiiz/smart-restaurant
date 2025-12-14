
import api, {API_URL} from "./api";

const login = async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
}

const registerSystem = async (data) => {
    const response = await api.post('/auth/system/register', data);
    return response.data;
}

const register = async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
}

const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
}

const resetPassword = async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
}

const getGoogleAuthUrl = () => {
    return `${API_URL}/auth/google`;
}

export const authService = {
    login, 
    register,
    registerSystem,
    forgotPassword,
    resetPassword,
    getGoogleAuthUrl,
};