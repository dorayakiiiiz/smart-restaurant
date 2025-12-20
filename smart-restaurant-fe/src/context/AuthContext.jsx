// cung cấp data global về authentication qua useContext

import { createContext, useContext, useState, useEffect } from "react";
import { userService } from "../services/userService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            const fetchUser = async () => {
                try {
                    const { user } = await userService.getAccount();
                    // data trả về nằm trong res.data
                    setUser(user);
                } catch (err) {
                    console.log('Error while getting user account: ', err);
                    setToken('');
                    localStorage.removeItem('token');
                } finally {
                    // loading xong
                    setIsLoading(false);
                }
            }
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const login = (jwt) => {
        setIsLoading(true);
        setToken(jwt);
        localStorage.setItem('token', jwt);
    }

    const logout = () => {
        setUser(null);
        setToken('');
        localStorage.removeItem('token');
    }

    if (isLoading) {
        return (
            <div className="h-screen w-full flex justify-center items-center bg-red-800 text-3xl md:text-5xl text-[#fff] font-momo">
                Smart restaurant is loading...
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, logout, isLogin: !!token }}>
            {children}
        </AuthContext.Provider>
    )

}

