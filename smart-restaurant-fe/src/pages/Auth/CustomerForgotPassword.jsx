import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

export default function CustomerForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        
        try {
            await authService.forgotPassword(email);
            setMessage("We have sent a password reset link to your email.");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex font-quicksand bg-white">
            {/* Left Side - Image (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#800020] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="relative z-10 p-12 text-white max-w-lg text-center">
                    <h1 className="text-4xl font-bold font-momo mb-4">Forgot Password?</h1>
                    <p className="text-lg text-red-100">
                        Don't worry, it happens to the best of us. We'll help you recover your account in no time.
                    </p>
                </div>
            </div>

            {/* Right Side - Form (Mobile Optimized) */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#f8f9fa]">
                
                {/* Mobile Header Section */}
                <div className="relative bg-[#800020] pt-12 pb-24 px-8 text-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner border border-white/20">
                            <i className="fa-solid fa-key text-2xl text-[#D4AF37]"></i>
                        </div>
                        <h2 className="text-3xl font-bold text-white font-momo mb-1">Recovery</h2>
                        <p className="text-red-100 text-sm">Reset your password securely</p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 px-6 -mt-10 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 h-full md:h-auto">
                        <div className="mb-6">
                            <Link to="/auth/login" className="inline-flex items-center text-gray-500 hover:text-[#800020] transition-colors font-bold text-sm">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
                            </Link>
                        </div>

                        {message ? (
                            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center animate-fade-in">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 text-xl">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                                <h3 className="text-green-800 font-bold text-lg mb-1">Check your email</h3>
                                <p className="text-green-700 text-sm">{message}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-3">
                                        <i className="fa-solid fa-circle-exclamation"></i>
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-red-100 transition-all font-medium"
                                        placeholder="name@example.com"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-4 bg-[#800020] hover:bg-[#600018] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-lg"
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}