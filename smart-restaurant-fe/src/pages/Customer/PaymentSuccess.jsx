import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    
    useEffect(() => {
        // Trang này chỉ hiển thị tạm khi PayOS redirect về
        // Socket event session_ended sẽ được CartContext xử lý
        // Nếu socket chưa kịp nhận, fallback sau 10s

        // --- Lưu lại nhà hàng đã ghé trước khi xóa session ---
        const currentSession = JSON.parse(localStorage.getItem("session_info"));
        if (currentSession?.restaurant) {
            localStorage.setItem("visited_restaurant", JSON.stringify(currentSession.restaurant));
        }

        // const fallbackTimer = setTimeout(() => {
        //     localStorage.removeItem("session_info");
        //     localStorage.removeItem("customer_cart");
        //     if (user)
        //         window.location.href = "/profile";
        //     else
        //         window.location.href = "/menu";
        // }, 4000);

        // return () => clearTimeout(fallbackTimer);
    }, []);

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
                        Payment successfully
                    </p>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                        Thanks for dining with us. Your culinary experience continues shortly.
                    </p>
                </div>
            </div>
        </div>
    );
}