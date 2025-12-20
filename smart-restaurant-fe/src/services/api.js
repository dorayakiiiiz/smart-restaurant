// cấu hình API gửi request đến server 
// (dùng axious thay thế fetch)

import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 100000
});

let accessToken = null;
let setAccessToken = null;

// Hàm để AuthContext gọi khi mount
export const injectTokenUtils = (token, setToken) => {
    accessToken = token;
    setAccessToken = setToken;
};

// request interceptor tự động thêm token, header... vào request
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
})

api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;

    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) 
                throw new Error('No refresh token.');

            const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });

            const newAccessToken = response.data.accessToken;
            setAccessToken(newAccessToken);

            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return api(originalRequest);

        } catch (err) {
            localStorage.removeItem('refreshToken');
            setAccessToken(null);
            window.location.href = '/auth/system/login';
            return Promise.reject(err);
        }
    }

    return Promise.reject(error);
})

export default api;