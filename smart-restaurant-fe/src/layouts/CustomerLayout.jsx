import { Outlet, Link, useLocation, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CustomerLayout() {
    const { cartItems, sessionInfo } = useCart();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const tokenParam = searchParams.get('token');

    // Logic chặn: Chưa có session VÀ không phải đang quét QR
    const shouldBlock = !sessionInfo && !location.pathname.includes('scan') && !tokenParam;

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
                        <span className="bg-[#FFF8E1] px-2 py-0.5 rounded-md border border-[#FCEabb]">
                            {/* Lấy tên bàn an toàn */}
                            TABLE {sessionInfo?.session?.tableId?.name || "..."}
                        </span>
                    </div>
                </div>
                <Link to="/auth/customer/login" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">
                    <i className="fa-regular fa-user"></i>
                </Link>
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                <Outlet />
            </div>

            {/* Bottom Navigation Floating (4 Tabs: Menu, Cart, Orders, Profile) */}
            <div className="fixed bottom-6 left-4 right-4 h-[70px] bg-[#1a1a1a] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] grid grid-cols-4 items-center z-40 px-2">
                
                <Link to="/menu" className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/menu') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-utensils text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Menu</span>
                </Link>
                
                <Link to="/cart" className="relative flex flex-col items-center gap-1 p-2">
                    <div className={`relative transition ${isActive('/cart') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                        <i className="fa-solid fa-basket-shopping text-xl"></i>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#1a1a1a]">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide ${isActive('/cart') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Cart</span>
                </Link>

                <Link to="/orders" className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/orders') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-receipt text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Orders</span>
                </Link>

                <Link to="/auth/customer/login" className={`flex flex-col items-center gap-1 p-2 transition ${isActive('/auth/customer/login') ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    <i className="fa-solid fa-user text-lg"></i>
                    <span className="text-[10px] font-bold tracking-wide">Profile</span>
                </Link>
            </div>
        </div>
    );
}