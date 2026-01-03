import { Outlet, NavLink, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CustomerLayout() {
    const { cartItems, sessionInfo, showThankYou, paymentMethod } = useCart();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const tokenParam = searchParams.get('token');

    // Hiển thị màn hình Thank You khi thanh toán thành công
    if (showThankYou) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a]/95 z-[9999] flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                <div className="absolute w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px]"></div>

                <div className="relative flex flex-col items-center max-w-md w-full">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-ping"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-tr from-[#D4AF37] to-[#F5E0A3] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.3)]">
                            <i className="fa-solid fa-check text-4xl text-[#1a1a1a]"></i>
                        </div>
                    </div>

                    <div className="text-center space-y-4 mb-12">
                        <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Thank you</h1>
                        <div className="h-px w-12 bg-[#D4AF37] mx-auto"></div>
                        <p className="text-[#D4AF37] font-bold text-lg tracking-wide italic">
                            {paymentMethod === 'cash' ? 'Cash payment received' : 'Payment successfully'}
                        </p>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                            Thanks for dining with us. Your culinary experience continues shortly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    // Logic chặn: Chưa có session VÀ không phải đang quét QR và không phải đang ở trang profile
    const isProfilePage = location.pathname === '/profile';
    const shouldBlock = !sessionInfo && !tokenParam && !isProfilePage;

    if (shouldBlock) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center font-quicksand">
                <div className="w-24 h-24 bg-[#D4AF37] rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(212,175,55,0.3)] animate-pulse">
                    <i className="fa-solid fa-qrcode text-5xl text-black"></i>
                </div>
                <h2 className="text-3xl font-momo font-bold mb-3 text-[#D4AF37]">Smart Restaurant</h2>
                <p className="text-gray-300 text-lg max-w-xs leading-relaxed">
                    Please scan the QR code on your table to start ordering.
                </p>

                {user && (
                    <NavLink to="/profile" className="mt-8 px-6 py-3 bg-white/10 rounded-full text-sm font-bold hover:bg-white/20 transition">
                        Go to My Profile
                    </NavLink>
                )}
            </div>
        );
    }

    // Helper để check active tab
    const isActive = (path) => location.pathname === path;

    return (
        <div className="bg-[#F9F9F9] min-h-screen pb-[100px] font-quicksand">
            {/* Header Premium */}
            <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-30 flex justify-between items-center">
                <div>
                    <h1 className="font-momo font-bold text-xl text-[#1a1a1a]">
                        {sessionInfo?.restaurant?.name || "Smart Restaurant"}
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] mt-0.5">
                        <span className={`${sessionInfo?.session ? '' : 'hidden'} bg-[#FFF8E1] px-2 py-0.5 rounded-md border border-[#FCEabb]`}>
                            {/* Lấy tên bàn an toàn */}
                            {sessionInfo?.session?.tableId?.name}
                        </span>
                    </div>
                </div>
                <NavLink 
                    to="/restaurant-profile" 
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center hover:border-[#D4AF37] transition-all shadow-sm hover:shadow-md"
                >
                    {sessionInfo?.restaurant?.logoUrl ? (
                        <img 
                            src={sessionInfo.restaurant.logoUrl} 
                            alt="Restaurant" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <i className="fa-solid fa-utensils text-[#D4AF37]"></i>
                    )}
                </NavLink>
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                <Outlet />
            </div>

            {/* Bottom Navigation Floating (4 Tabs: Menu, Cart, Orders, Profile) */}
            <div className="fixed bottom-6 left-4 right-4 h-[70px] bg-[#1a1a1a] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] grid grid-cols-4 items-center z-40 px-2">
                
                <NavLink to="/menu" className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/menu') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-utensils text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Menu</span>
                </NavLink>
                
                <NavLink to="/cart" className="relative flex flex-col items-center gap-1 p-2">
                    <div className={`relative transition ${isActive('/cart') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                        <i className="fa-solid fa-basket-shopping text-xl"></i>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#1a1a1a]">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide ${isActive('/cart') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Cart</span>
                </NavLink>

                <NavLink to="/orders" className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/orders') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-receipt text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Orders</span>
                </NavLink>

                <NavLink to={user ? '/profile' : '/auth/login'} className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/profile') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-user text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Profile</span>
                </NavLink>
            </div>
        </div>
    );
}