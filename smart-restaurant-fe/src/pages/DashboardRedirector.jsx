import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardRedirector() {
    const { user } = useAuth();

    if (!user) 
        return <Navigate to="/auth/system/login" replace />;

    // 1. Super Admin
    if (user.role === 'super_admin') 
        return <Navigate to="/system/super/admin/dashboard" replace />;
    
    // 2. Restaurant Owner (Admin)
    if (user.role === 'admin') {
        if (!user.restaurant) {
            return <Navigate to="/system/admin/setup" replace />;
        }
        return <Navigate to="/system/admin/dashboard" replace />;
    }

    // 3. Waiter (MỚI)
    if (user.role === 'waiter') {
        return <Navigate to="/waiter/dashboard" replace />;
    }

    // 4. Kitchen (MỚI)
    if (user.role === 'kitchen') {
        return <Navigate to="/kitchen/dashboard" replace />;
    }

    // Default fallback
    return <Navigate to="/" replace />;
}