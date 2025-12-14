import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
    const { user, isLogin } = useAuth();

    if (!isLogin) {
        return <Navigate to="/auth/system/login" replace />;
    }

    if (!user) {
        return (
            <div className="h-screen w-full text-center flex justify-center items-center bg-[#0060AD] text-5xl text-[#fff] font-momo">
                Linkify is loading...
            </div>
        )
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}