// cung cấp data global về authentication qua useContext

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { userService } from "../services/userService";
import { injectTokenUtils, API_URL } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '');

    // // refresh lại token khi web load lại
    // useEffect(() => {
    //     const tryRefresh = async () => {
    //         if (!accessToken && refreshToken) {
    //             try {
    //                 const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
    //                 setAccessToken(res.data.accessToken);
    //             } catch (err) {
    //                 setAccessToken(null);
    //                 setRefreshToken('');
    //                 localStorage.removeItem('refreshToken');
    //             } finally {
    //                 setIsLoading(false);
    //             }
    //         } else {
    //             setIsLoading(false);
    //         }
    //     };
    //     tryRefresh();
    // }, []);

    // useEffect(() => {
    //     if (accessToken) {
    //         const fetchUser = async () => {
    //             try {
    //                 const { user } = await userService.getAccount();
    //                 setUser(user);
    //             } catch (err) {
    //                 console.log('Error while getting user account: ', err);
    //                 setAccessToken(null);
    //                 setRefreshToken('');
    //                 localStorage.removeItem('refreshToken');
    //             } finally {
    //                 setIsLoading(false);
    //             }
    //         }
    //         fetchUser();
    //     } else {
    //         setIsLoading(false);
    //     }
    // }, [accessToken]);


    // inject token qua cho api gọi
    useEffect(() => {
        injectTokenUtils(accessToken, setAccessToken);
    }, [accessToken]);

    // logic khởi tạo chạy 1 lần duy nhất khi Mount
    useEffect(() => {
        const initializeAuth = async () => {
            const storedRefreshToken = localStorage.getItem('refreshToken');

            // Nếu không có refresh token -> coi như chưa login -> dừng load
            if (!storedRefreshToken) {
                setIsLoading(false);
                return;
            }

            try {
                // B1: Gọi API lấy Access Token mới
                const res = await axios.post(`${API_URL}/auth/refresh-token`, { 
                    refreshToken: storedRefreshToken 
                });
                
                const newAccessToken = res.data.accessToken;

                // Cập nhật State
                setAccessToken(newAccessToken);
                setRefreshToken(storedRefreshToken); // Giữ sync state

                // QUAN TRỌNG: Inject token ngay lập tức vào axios instance 
                // để lệnh gọi getUser bên dưới có header Authorization
                injectTokenUtils(newAccessToken, setAccessToken);

                // B2: Có token rồi thì lấy thông tin User luôn
                const { user } = await userService.getAccount();
                setUser(user);

            } catch (err) {
                console.log('Session expired or invalid:', err);
                // Nếu lỗi (token hết hạn, user bị khóa...) -> Xóa sạch
                setAccessToken(null);
                setRefreshToken('');
                setUser(null);
                localStorage.removeItem('refreshToken');
            } finally {
                // B3: Dù thành công hay thất bại thì lúc này mới cho phép Render UI
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []); // Chỉ chạy 1 lần

    const login = (refreshTokenValue, accessTokenValue) => {
        setIsLoading(true);
        localStorage.setItem('refreshToken', refreshTokenValue);
        setAccessToken(accessTokenValue);
        setRefreshToken(refreshTokenValue);

        // reload lại tránh đứng yên khi vừa login
        window.location.reload();
    }

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken('');
        localStorage.removeItem('refreshToken');
    }

    if (isLoading) {
        return (
            <div className="h-screen w-full flex justify-center items-center bg-red-800 text-3xl md:text-5xl text-[#fff] font-momo">
                Smart restaurant is loading...
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ 
            user, setUser, 
            accessToken, setAccessToken, 
            refreshToken, setRefreshToken,
            login, logout, 
            isLogin: !!accessToken 
        }}>
            {children}
        </AuthContext.Provider>
    )

}

