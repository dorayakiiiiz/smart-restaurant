import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardRedirector() {
    const { user } = useAuth();

    if (!user) 
        return <Navigate to="/auth/system/login" replace />;

    if (user.role === 'super_admin') 
        return <Navigate to="/system/super-admin/dashboard" replace />;
    
    if (user.role === 'admin') {
        return <Navigate to="/system/admin" replace />;
    }

    // Waiter/Kitchen logic sau này
    return <Navigate to="/" replace />;
}