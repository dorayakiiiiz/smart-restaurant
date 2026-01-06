import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function CustomerLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState(""); 
    
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const receiveMessageFromPopUp = async(e) => {
            const { type, payload } = e.data;
            if (type === 'login_success') {
                const { refreshToken, accessToken } = payload;
                
                setSuccessMsg("Login successful! Redirecting...");

                setTimeout(async () => {
                    await login(refreshToken, accessToken);
                    navigate('/profile'); 
                }, 1500);
            }
            else if (type === 'login_failed' || type === 'error') {
                setError(payload?.message || 'Login failed');
            }
        }
        window.addEventListener('message', receiveMessageFromPopUp);
        return () => window.removeEventListener('message', receiveMessageFromPopUp);
    }, [login, navigate]);

    const handleGoogleLogin = () => {
        const width = 500, height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        window.open(
            authService.getGoogleAuthUrl(), 
            "Google Login", 
            `width=${width},height=${height},top=${top},left=${left}`
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await authService.login({ email, password });
            
            setSuccessMsg("Login successful! Redirecting...");
            setLoading(false);

            setTimeout(async () => {
                await login(res.refreshToken, res.accessToken);
                navigate('/profile'); 
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
            setLoading(false); 
        }
    };

    return (
        <div className="min-h-screen w-full flex font-quicksand bg-white">
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#1a1a1a] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div className="relative z-10 p-12 text-white max-w-lg">
                    <h1 className="text-5xl font-bold font-momo mb-6 leading-tight text-[#D4AF37]">Fine Dining <br/>Experience</h1>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Log in to access your personalized menu, order history, and exclusive rewards.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col bg-[#f8f9fa]">
                
                <div className="relative bg-[#800020] pt-8 pb-24 px-8 text-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    <button 
                        className="w-8 h-8 bg-white relative z-10 cursor-pointer rounded-full flex items-center justify-center"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa-solid fa-arrow-left text-xs text-[#D4AF37]"></i>
                    </button>

                    <div className="relative z-10 pt-4">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner border border-white/20">
                            <i className="fa-solid fa-utensils text-2xl text-[#D4AF37]"></i>
                        </div>
                        <h2 className="text-3xl font-bold text-white font-momo mb-1">Welcome Back</h2>
                        <p className="text-red-100 text-sm">Sign in to continue your dining experience</p>
                    </div>
                </div>

                <div className="flex-1 px-6 -mt-10 mb-10 relative z-20">
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 h-full md:h-auto">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {successMsg && (
                                <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl flex items-center gap-2 animate-pulse">
                                    <i className="fa-solid fa-circle-check"></i>
                                    {successMsg}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <i className="fa-regular fa-envelope"></i>
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError("") }}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium text-gray-800 placeholder-gray-400"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-bold text-gray-700">Password</label>
                                    <Link to="/auth/forgot-password" className="text-xs font-bold text-[#800020] hover:underline">Forgot?</Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <i className="fa-solid fa-lock"></i>
                                    </div>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError("") }}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium text-gray-800 placeholder-gray-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading || successMsg}
                                className="w-full py-4 bg-[#800020] hover:bg-[#600018] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                ) : successMsg ? (
                                    <span className="flex items-center gap-2"><i className="fa-solid fa-check"></i> Success</span>
                                ) : (
                                    <>
                                        Sign In <i className="fa-solid fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button 
                                    type="button"
                                    onClick={handleGoogleLogin} 
                                    className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700"
                                >
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                    Google
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            Don't have an account? 
                            <Link to="/auth/register" className="ml-1 font-bold text-[#800020] hover:underline">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}