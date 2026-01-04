
import api, {API_URL} from "./api";

const login = async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
}

const sendRegisterOtp = async (data) => {
    // data: { email, fullName, password, restaurantId }
    // Server will validate, check duplicate, generate OTP and send email
    const response = await api.post('/auth/register-otp', data);
    return response.data;
}

const verifyRegisterAndCreate = async (data) => {
    // data: { email, otp, fullName, password, restaurantId }
    const response = await api.post('/auth/register-verify', data);
    return response.data;
}

// const register = async (data) => {
//     const response = await api.post('/auth/register', data);
//     return response.data;
// }

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
    // register,
    sendRegisterOtp,     
    verifyRegisterAndCreate,
    forgotPassword,
    resetPassword,
    getGoogleAuthUrl,
};