import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

export default function CustomerRegister() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState(""); 
    const [agreeTerms, setAgreeTerms] = useState(false);
    
    // State cho UI mockup (Đã xóa emailValid)
    const [passStrength, setPassStrength] = useState(0); // 0-4

    const navigate = useNavigate();

    // Check password strength
    useEffect(() => {
        const pass = formData.password;
        let score = 0;
        if (pass.length > 5) score++;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        setPassStrength(score);
    }, [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreeTerms) {
            setError("Please agree to the Terms of Service.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        setLoading(true);
        setError("");
        setSuccessMsg(""); 

        try {
            await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password
            });
            
            setSuccessMsg("Registration successful! Redirecting to login...");
            
            setTimeout(() => {
                navigate('/auth/login');
            }, 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Registration failed.";
            setError(errorMsg);
            setLoading(false); 
        }
    };

    // Helper để lấy màu thanh strength
    const getStrengthColor = () => {
        if (passStrength <= 1) return "bg-red-500";
        if (passStrength === 2) return "bg-yellow-500";
        if (passStrength >= 3) return "bg-green-500";
        return "bg-gray-200";
    };

    const getStrengthText = () => {
        if (passStrength <= 1) return "Weak";
        if (passStrength === 2) return "Medium";
        if (passStrength >= 3) return "Strong";
        return "";
    };

    return (
        <div className="min-h-screen w-full flex font-quicksand bg-white">
            {/* Left Side - Image (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#1a1a1a] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div className="relative z-10 p-12 text-white max-w-lg">
                    <h1 className="text-5xl font-bold font-momo mb-6 leading-tight text-[#D4AF37]">Join Our <br/>Community</h1>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Create an account to unlock exclusive offers and track your orders.
                    </p>
                </div>
            </div>

            {/* Right Side - Form (Mobile Optimized) */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#f8f9fa]">
                
                {/* Mobile Header Section */}
                <div className="relative bg-[#800020] pt-6 pb-20 px-8 text-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <button 
                        className="w-8 h-8 bg-white relative z-10 cursor-pointer rounded-full flex items-center justify-center"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa-solid fa-arrow-left text-xs text-[#D4AF37]"></i>
                    </button>

                    <div className="relative z-10 pt-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
                            <i className="fa-solid fa-utensils text-2xl text-[#D4AF37]"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-white font-momo">Create Account</h2>
                    </div>
                </div>

                {/* Form Container - Overlapping */}
                <div className="flex-1 px-4 -mt-10 relative z-20 pb-10">
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Success Message */}
                            {successMsg && (
                                <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl flex items-center gap-2 animate-pulse">
                                    <i className="fa-solid fa-circle-check"></i>
                                    {successMsg}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    {error}
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                <input 
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email - Đã xóa phần check available */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                                <input 
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                                <input 
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="Create a password"
                                />
                                {/* Strength Meter */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-gray-500">Min 8 chars with uppercase, lowercase, and number</p>
                                            <span className={`text-xs font-bold ${passStrength >= 3 ? 'text-green-600' : passStrength === 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {getStrengthText()}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-300 ${getStrengthColor()}`} 
                                                style={{ width: `${(passStrength / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                                <input 
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="Confirm your password"
                                />
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-3 pt-2">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-red-300 accent-[#800020]"
                                    />
                                </div>
                                <label htmlFor="terms" className="text-sm text-gray-600">
                                    I agree to the <a href="#" className="text-[#800020] font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-[#800020] font-bold hover:underline">Privacy Policy</a>
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || successMsg} 
                                className="w-full py-3.5 bg-[#800020] hover:bg-[#600018] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-base mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                                    </span>
                                ) : successMsg ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-check"></i> Success
                                    </span>
                                ) : "Create Account"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-white text-sm text-gray-400">or</span>
                            </div>
                        </div>

                        {/* Google Button */}
                        <a 
                            href={authService.getGoogleAuthUrl()} 
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            Sign up with Google
                        </a>

                        <div className="mt-6 text-center text-sm text-gray-600">
                            Already have an account? 
                            <Link to="/auth/login" className="ml-1 font-bold text-[#800020] hover:underline">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}