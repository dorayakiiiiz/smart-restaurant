import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";
import { authService } from "../../services/authService";
import { Validator } from "../../utils/validators";

export default function ResetPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const otpInputRefs = useRef([]);
    const [log, setLog] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);

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
        if (element.value && index < 5) otpInputRefs.current[index + 1].focus();
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();
        const emailError = Validator.validateEmail(email);
        if (emailError) return setLog({ type: 'error', content: emailError });

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setLog({ type: 'success', content: 'OTP sent to your email.' });
            setStep(2);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitStep2 = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) return setLog({ type: 'error', content: 'Please enter valid OTP' });
        if (newPassword.length < 6) return setLog({ type: 'error', content: 'Password too short' });

        setLoading(true);
        try {
            await authService.resetPassword({ email, otp: otpValue, newPassword });
            setLog({ type: 'success', content: 'Password reset successfully!' });
            setTimeout(() => navigate('/auth/login'), 2000);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Reset failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full h-screen bg-white overflow-hidden">
            {/* Left Side */}
            <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                <div className="relative z-10 text-center px-10">
                    <h1 className="font-momo text-6xl text-[#D4AF37] mb-4 drop-shadow-lg">Security</h1>
                    <p className="text-gray-300 text-xl font-light tracking-wider">Recover your access securely.</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-[#fff]">
                <div className="w-full max-w-[450px]">
                    <div className="lg:hidden text-center mb-10">
                        <h1 className="font-momo text-4xl text-[#800020] font-bold">Smart Restaurant</h1>
                    </div>

                    {step === 1 ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                                <p className="text-gray-500">Enter your email to receive a recovery code.</p>
                            </div>
                            <form className="flex flex-col gap-4" onSubmit={handleSubmitStep1}>
                                <Input type="email" value={email} placeholder="Enter your email" setState={setEmail} />
                                <div className={`min-h-[24px] text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{log.content}</div>
                                <Button backgrond={{ normal: "#1a1a1a", hover: "#800020" }} color="#fff" text={loading ? "Sending..." : "Send Code"} onClick={handleSubmitStep1} disabled={loading} />
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify & Reset</h2>
                                <p className="text-gray-500">Enter the 6-digit code sent to {email}.</p>
                            </div>
                            <form className="flex flex-col gap-6" onSubmit={handleSubmitStep2}>
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
                                <Input type="password" value={newPassword} placeholder="New password" setState={setNewPassword} />
                                <div className={`min-h-[24px] text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{log.content}</div>
                                <Button backgrond={{ normal: "#1a1a1a", hover: "#800020" }} color="#fff" text={loading ? "Verifying..." : "Reset Password"} onClick={handleSubmitStep2} disabled={loading} />
                                <div className="text-center text-sm text-gray-500 hover:text-black cursor-pointer mt-2" onClick={() => setStep(1)}>Back to Email</div>
                            </form>
                        </>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Remember your password? 
                        <Link to="/auth/login" className="ml-1 font-bold text-[#800020] hover:underline">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}