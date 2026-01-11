import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function CustomerRegister() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // OTP State (Copied from ForgotPassword)
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const otpInputRefs = useRef([]);

    // State timer
    const [resendTimer, setResendTimer] = useState(0);
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState(""); 
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);

    const sessionInfo = JSON.parse(localStorage.getItem("session_info"));
    const restaurantId = sessionInfo.session.restaurantId._id;
    
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
        setError("");
    };

    const handleCheckEmail = async () => {
        try {
            setLoading(true);
            await authService.checkEmail({ email: formData.email, restaurantId });
            setEmailStatus('available');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Registration failed.";
            setEmailStatus('unavailable');
        } finally {
            setLoading(false);
        }
    }

    // --- OTP LOGIC ---
    const handleOtpChange = (element, index) => {
        setError("");
        setSuccessMsg("");
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.value && index < 5) {
            otpInputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    const { login } = useAuth();

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

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!restaurantId) {
            setError("Missing restaurant information. Please scan QR code again.");
            return;
        }

        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!agreeTerms) {
            setError("Please agree to the Terms of Service.");
            return;
        }

        
        setLoading(true);
        setError("");
        setSuccessMsg(""); 

        try {
            await authService.sendRegisterOtp({
                email: formData.email,
                fullName: formData.fullName,
                password: formData.password,
                restaurantId
            });
            
            setSuccessMsg("OTP sent to your email.");
            setResendTimer(60);
            setTimeout(() => {
                setSuccessMsg("");
                setStep(2);
            }, 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Registration failed.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        
        setLoading(true);
        setError("");
        setSuccessMsg("");
        
        try {
            await authService.sendRegisterOtp({
                email: formData.email,
                fullName: formData.fullName,
                password: formData.password,
                restaurantId
            });
            setSuccessMsg("New OTP sent to your email.");
            setResendTimer(60); // Reset timer
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitStep2 = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError("Please enter full 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            await authService.verifyRegisterAndCreate({
                email: formData.email,
                otp: otpValue,
                fullName: formData.fullName,
                password: formData.password,
                restaurantId
            });

            setSuccessMsg("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate('/auth/login');
            }, 1600);
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed.");
        } finally {
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
                        <h2 className="text-2xl font-bold text-white font-momo">
                            {step === 1 ? "Create Account" : "Verify Email"}
                        </h2>
                    </div>
                </div>

                {/* Form Container - Overlapping */}
                <div className="flex-1 px-4 -mt-10 relative z-20 pb-10">
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
                        {/* Success Message */}
                        {successMsg && (
                            <div className="mb-2 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl flex items-center gap-2 animate-pulse">
                                <i className="fa-solid fa-circle-check"></i>
                                {successMsg}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}
                        {step === 1 && (
                            <>
                                <form onSubmit={handleSubmitStep1} className="space-y-4">
                                    
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

                                    {/* Email */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700 ml-1">
                                            Email
                                            {loading ? (
                                                <span className="text-blue-500 font-normal ml-3">
                                                    <i className="fa-solid fa-spinner mr-1"></i>
                                                    Checking
                                                </span>
                                            ) : (emailStatus && (
                                                emailStatus === 'available' ? (
                                                    <span className="text-green-500 font-normal ml-3">
                                                        <i className="fa-solid fa-circle-check mr-1"></i>
                                                        Available
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 font-normal ml-3">
                                                        <i className="fa-solid fa-circle-xmark mr-1"></i>
                                                        Email is already exists.
                                                    </span>
                                                )
                                            ))}
                                        </label>
                                        <input 
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                            placeholder="you@example.com"
                                            onBlur={handleCheckEmail}
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
                                        disabled={loading || successMsg || emailStatus === 'unavailable'} 
                                        className="w-full py-3.5 bg-[#800020] hover:bg-[#600018] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-base mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                                            </span>
                                        ) : successMsg ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <i className="fa-solid fa-check"></i> OTP Sent
                                            </span>
                                        ) : "Sign Up"}
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
                                <button
                                    type="button" 
                                    onClick={handleGoogleLogin} 
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700"
                                >
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                    Sign up with Google
                                </button>

                                <div className="mt-6 text-center text-sm text-gray-600">
                                    Already have an account? 
                                    <Link to="/auth/login" className="ml-1 font-bold text-[#800020] hover:underline">Sign In</Link>
                                </div>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <form className="flex flex-col gap-10 w-full" onSubmit={handleSubmitStep2}>
                                    <div className="text-gray-500 text-center">Enter a 6-digit OTP sent to your email.</div>
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((data, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                maxLength="1"
                                                className="w-12 h-14 border border-gray-300 rounded-lg text-center text-xl font-bold focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-none transition bg-gray-50"
                                                value={data}
                                                ref={el => otpInputRefs.current[index] = el}
                                                onChange={e => handleOtpChange(e.target, index)}
                                                onKeyDown={e => handleOtpKeyDown(e, index)}
                                                onFocus={e => e.target.select()}
                                            />
                                        ))}
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        onClick={handleSubmitStep2}
                                        className={`w-full py-4 ${loading ? 'bg-[#600018]' : 'bg-[#800020] hover:bg-[#600018]'} text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-lg`}
                                    >
                                        {loading ? "Processing..." : "Verify & Create Account"}
                                    </button>
                                    
                                    <div className="text-center -mt-4">
                                        <div className="text-gray-400 mb-1">Didn't receive code?</div>
                                        <div 
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendTimer > 0 || loading}
                                            className={`text-sm font-bold transition-colors ${
                                                resendTimer > 0 
                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                    : 'text-[#800020] hover:underline'
                                            }`}
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button 
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="text-sm text-gray-500 hover:text-[#800020] font-semibold"
                                        >
                                            <i className="fa-solid fa-arrow-left mr-1"></i> Back to Info
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}