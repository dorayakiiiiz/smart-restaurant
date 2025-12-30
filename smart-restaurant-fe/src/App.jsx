import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Contexts
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layouts
import BaseLayout from "./layouts/BaseLayout";
import BlankLayout from "./layouts/BlankLayout";
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import SuperAdminDashboardLayout from "./layouts/SuperAdminDashboardLayout";
import CustomerLayout from "./layouts/CustomerLayout";

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
import MenuManagement from "./pages/AdminDashboard/MenuManagement";
import  CategoriesManagement  from "./pages/AdminDashboard/CategoriesManagement";
import OrdersPage from "./pages/AdminDashboard/OrdersPage";
import { KDSPage, ReportsPage } from "./pages/AdminDashboard/PlaceholderPage";
import StaffManagementPage from "./pages/AdminDashboard/StaffManagementPage";
import RestaurantSetupPage from "./pages/AdminDashboard/RestaurantSetupPage";
import SettingsPage from "./pages/AdminDashboard/SettingsPage"; 
import TablesPage from "./pages/AdminDashboard/TablesPage"; 
import Test from "./pages/AdminDashboard/Test";
import MenuItemDetail from "./pages/AdminDashboard/MenuItemDetail";

// Customer Pages
import MenuPage from "./pages/Customer/MenuPage";
import CartPage from "./pages/Customer/CartPage";
import OrderTrackingPage from "./pages/Customer/OrderTrackingPage";
import MenuDetailPage from "./pages/Customer/MenuDetailPage";
import CustomerLogin from "./pages/Auth/CustomerLogin";
import CustomerRegister from "./pages/Auth/CustomerRegister";
import CustomerForgotPassword from "./pages/Auth/CustomerForgotPassword"; // Import mới
import CustomerProfilePage from "./pages/Customer/CustomerProfilePage";

// Import Pages mới
import WaiterDashboard from "./pages/Waiter/WaiterDashboard";
import PendingOrders from "./pages/Waiter/PendingOrders";
import AcceptedOrders from "./pages/Waiter/AcceptedOrders";
import ReadyToServe from "./pages/Waiter/ReadyToServe";
import MyTables from "./pages/Waiter/MyTables";
import KitchenDashboard from "./pages/Kitchen/KitchenDashboard";

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
                <CartProvider>
                    <Routes>
                        {/* 1. Landing Page & Profile (Giữ Header/Footer cho các trang này) */}
                        <Route element={<BaseLayout />}>
                            <Route path="/" element={<Home />} />
                            
                        </Route>

                        {/* 2. Customer Auth (Login/Register/Forgot) - TÁCH RA KHỎI BaseLayout */}
                        <Route path="/auth/login" element={<CustomerLogin />} />
                        <Route path="/auth/register" element={<CustomerRegister />} />
                        <Route path="/auth/forgot-password" element={<CustomerForgotPassword />} />


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
                                <Route path="menu" element={<MenuManagement />} />
                                <Route path="categories" element={<CategoriesManagement />} />
                                <Route path="menu/:id" element={<MenuItemDetail />} />
                                <Route path="tables" element={<TablesPage />} />
                                <Route path="orders" element={<OrdersPage />} />
                                <Route path="kds" element={<KDSPage />} />
                                <Route path="staff" element={<StaffManagementPage />} />
                                <Route path="reports" element={<ReportsPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="test" element={< Test/>} />

                            </Route>
                        </Route>

                        {/* 2. Customer Flow (Mobile First) */}
                        <Route element={<CustomerLayout />}>
                            <Route path="/menu" element={<MenuPage />} />
                            <Route path="/menu/public/:id/:restaurantId" element={<MenuDetailPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/orders" element={<OrderTrackingPage />} />
                            
                            {/* SỬA: Đưa Profile vào đây và bọc ProtectedRoute */}
                            <Route element={<ProtectedRoute allowedRoles={['customer']} loginPath="/auth/login" />}>
                                <Route path="/profile" element={<CustomerProfilePage />} />
                            </Route>
                        </Route>

                        {/* WAITER ROUTES */}
                        <Route path="/waiter" element={<ProtectedRoute allowedRoles={['waiter', 'admin']} />}>
                            <Route index element={<Navigate to="dashboard/pending" replace />} />
                            <Route path="dashboard" element={<WaiterDashboard />}>
                                <Route index element={<Navigate to="pending" replace />} />
                                <Route path="pending" element={<PendingOrders />} />
                                <Route path="accepted" element={<AcceptedOrders />} />
                                <Route path="ready" element={<ReadyToServe />} />
                                <Route path="tables" element={<MyTables />} />
                            </Route>
                        </Route>

                        {/* KITCHEN ROUTES */}
                        <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<KitchenDashboard />} />
                            {/* Team có thể thêm route con: /kitchen/history... */}
                        </Route>

                    </Routes>
                </CartProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;