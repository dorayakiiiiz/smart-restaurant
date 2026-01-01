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
        const fallbackTimer = setTimeout(() => {
            localStorage.removeItem("session_info");
            localStorage.removeItem("customer_cart");
            if (user)
                window.location.href = "/profile";
            else
                window.location.href = "/menu";
        }, 5000);

        return () => clearTimeout(fallbackTimer);
    }, []);

    return (
        <div className="h-screen w-full bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center text-white">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
                <i className="fa-solid fa-check text-6xl text-green-500"></i>
            </div>
            <h1 className="text-4xl font-bold font-momo mb-3">Payment Successful!</h1>
            <p className="text-xl opacity-90">Thank you for dining with us.</p>
            <p className="text-sm mt-8 opacity-60">Processing your payment...</p>
        </div>
    );
}