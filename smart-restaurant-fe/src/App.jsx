import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Contexts
import { AuthProvider } from "./context/AuthContext";

// Layouts
import BaseLayout from "./layouts/BaseLayout";
import BlankLayout from "./layouts/BlankLayout";
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import SuperAdminDashboardLayout from "./layouts/SuperAdminDashboardLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardRedirector from "./pages/DashboardRedirector";

// Super Admin Pages (Placeholder)
import AdminManagementPage from "./pages/SuperAdminDashboard/AdminManagementPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard/SuperAdminDashboard"; // Trang Analytics

// Restaurant Admin Pages
import DashboardOverview from "./pages/AdminDashboard/DashboardOverview";
// import MenuManagementPage from "./pages/AdminDashboard/MenuManagementPage";
import { TablesPage, MenuPage, OrdersPage, KDSPage, StaffPage, ReportsPage } from "./pages/AdminDashboard/PlaceholderPage";
import RestaurantSetupPage from "./pages/AdminDashboard/RestaurantSetupPage";
import SettingsPage from "./pages/AdminDashboard/SettingsPage"; // Import trang mới tạo

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route element={<BaseLayout />}>
                        <Route path="/" element={<Home />} />
                    </Route>

                    {/* Auth Routes for restaurant system */}
                    <Route element={<BlankLayout />}>
                        <Route path="/auth/system/login" element={<Login />} />
                        <Route path="/auth/system/reset-password" element={<ResetPassword />} />
                    </Route>

                    {/* Redirector */}
                    <Route path="/dashboard" element={<DashboardRedirector />} />

                    {/* RESTAURANT SYSTEM ROUTES */}
                    <Route path="/system" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                        {/* cho super admin */}
                        <Route path="super/admin" element={<SuperAdminDashboardLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<SuperAdminDashboard />} />
                            <Route path="admins" element={<AdminManagementPage />} />
                            <Route path="settings" element={<div className="p-10 text-center text-gray-500">Settings Page (Coming Soon)</div>} />
                        </Route>

                        {/* cho admin restaurant */}
                        <Route path="admin/setup" element={<RestaurantSetupPage />} />
                        
                        <Route path="admin" element={<AdminDashboardLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardOverview />} />
                            <Route path="menu" element={<MenuPage />} />
                            <Route path="tables" element={<TablesPage />} />
                            <Route path="orders" element={<OrdersPage />} />
                            <Route path="kds" element={<KDSPage />} />
                            <Route path="staff" element={<StaffPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                        </Route>
                    </Route>

                </Routes>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;