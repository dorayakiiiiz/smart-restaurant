import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";
import { Validator } from "../../utils/validators";

export default function CustomerForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const otpInputRefs = useRef([]);
    const [log, setLog] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);
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

    const navigate = useNavigate();
    const { isLogin } = useAuth();

    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [log]);

    useEffect(() => {
        if (isLogin) navigate('/dashboard');
    }, [isLogin, navigate]);

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.value && index < 5) 
            otpInputRefs.current[index + 1].focus();
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();

        const emailError = Validator.validateEmail(email);
        if (emailError) {
            setLog({ type: 'error', content: emailError });
            return;
        }

        try {
            setLoading(true);
            await authService.forgotPassword(email);
            setLog({ type: 'success', content: 'OTP sent to your email.' });
            setTimeout(() => {
                setResendTimer(60);
                setStep(2);
                setLog({ type: '', content: '' });
            }, 2000);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        
        setLoading(true);
        setLog({ type: '', content: '' });
        
        try {
            await authService.forgotPassword(email);
            setLog({ type: 'success', content: 'New OTP sent to your email.'});
            setResendTimer(60); // Reset timer
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Failed to resend OTP.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitStep2 = async (e) => {
        e.preventDefault();

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setLog({ type: 'error', content: 'Please enter full 6-digit OTP.' });
            return;
        }
        
        const passwordError = Validator.validatePassword(newPassword);
        if (passwordError) {
            setLog({ type: 'error', content: passwordError });
            return;
        }

        try {
            setLoading(true);
            await authService.resetPassword({ email, otp: otpValue, newPassword });
            setLog({ type: 'success', content: 'Password reset successfully!' });
            setTimeout(() => navigate('/auth/login'), 2500);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Reset failed' });
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="min-h-screen w-full flex font-quicksand bg-white">
            {/* Left Side - Image (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#800020] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
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
                        <div className="mb-4">
                            {step === 1 ? (
                                <Link to="/auth/login" className="inline-flex items-center text-gray-500 hover:text-[#800020] transition-colors font-bold text-sm">
                                    <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
                                </Link>
                            ) : (
                                <div className="inline-flex items-center text-gray-500 hover:text-[#800020] transition-colors font-bold text-sm" onClick={() => setStep(1)}>
                                    <i className="fa-solid fa-arrow-left mr-2"></i> Back to Email
                                </div>
                            )}
                        </div>

                        {/* Log */}
                        {log.content && (
                            <div className={`p-3 mb-2 ${log.type === 'success' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600' } text-sm rounded-xl flex items-center gap-2`}>
                                <i className="fa-solid fa-circle-check"></i>
                                {log.content}
                            </div>
                        )}

                        {step === 1 ? (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-momo md:text-3xl text-gray-900 mb-2">Reset Password</h2>
                                    <p className="text-gray-500">Enter your email to receive a recovery code.</p>
                                </div>
                                <form className="flex flex-col gap-4" onSubmit={handleSubmitStep1}>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-red-100 transition-all font-medium"
                                        placeholder="name@example.com"
                                    />

                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        onClick={handleSubmitStep1}
                                        className={`w-full mt-2 py-4 ${loading ? 'bg-[#600018]' : 'bg-[#800020] hover:bg-[#600018]'} text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-lg`}
                                    >
                                        {loading ? "Sending..." : "Send Code"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-momo md:text-3xl text-gray-900 mb-2">Verify & Reset</h2>
                                    <p className="text-gray-500">Enter the 6-digit code sent to {email}.</p>
                                </div>
                                <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmitStep2}>
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((data, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                maxLength="1"
                                                className="w-10 h-12 md:w-12 md:h-14 border border-gray-300 rounded-lg text-center text-xl font-bold focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-none transition bg-gray-50"
                                                value={data}
                                                ref={el => otpInputRefs.current[index] = el}
                                                onChange={e => handleOtpChange(e.target, index)}
                                                onKeyDown={e => handleOtpKeyDown(e, index)}
                                                onFocus={e => e.target.select()}
                                            />
                                        ))}
                                    </div>

                                    <div className="text-gray-500">
                                        Enter new password
                                    </div>
    
                                    <input 
                                        type="passsword" 
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-red-100 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        onClick={handleSubmitStep2}
                                        className={`w-full mt-2 py-4 ${loading ? 'bg-[#600018]' : 'bg-[#800020] hover:bg-[#600018]'} text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] text-lg`}
                                    >
                                        {loading ? "Processing..." : "Reset Password"}
                                    </button>

                                    <div className="text-center">
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

                                </form>
                            </>
                        )}
    
                        <div className="mt-6 text-center text-sm text-gray-500">
                            Remember your password? 
                            <Link to="/auth/system/login" className="ml-1 font-bold text-[#800020] hover:underline">Log in</Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}