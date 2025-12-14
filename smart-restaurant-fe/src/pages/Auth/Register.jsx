import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";
import { authService } from "../../services/authService"; 
import { Validator } from "../../utils/validators";


export default function Register() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [log, setLog] = useState({ type: '', content: '' });

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

    const handleSubmit = async (e) => {
        e.preventDefault();

         // validate data
        const emailError = Validator.validateEmail(email);
        if (emailError) {
            setLog({ type: 'error', content: emailError });
            return;
        }

        const fullNameError = Validator.validateFullName(fullName);
        if (fullNameError) {
            setLog({ type: 'error', content: fullNameError });
            return;
        }

        const passwordError = Validator.validatePassword(password);
        if (passwordError) {
            setLog({ type: 'error', content: passwordError });
            return;
        }

        try {
            await authService.register({ email, fullName, password });
            setLog({ type: 'success', content: 'Account created! Redirecting to login...' });
            setTimeout(() => navigate('/auth/system/login'), 2000);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Registration failed' });
        }
    };

    return (
        <div className="flex w-full h-screen bg-white overflow-hidden">
            {/* Left Side - Image */}
            <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                
                <div className="relative z-10 text-center px-10">
                    <h1 className="font-momo text-6xl text-[#D4AF37] mb-4 drop-shadow-lg">
                        Join Us
                    </h1>
                    <p className="text-gray-300 text-xl font-light tracking-wider">
                        Create an account to start your journey.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-[#fff]">
                <div className="w-full max-w-[450px]">
                    <div className="lg:hidden text-center mb-10">
                        <h1 className="font-momo text-4xl text-[#800020] font-bold">Smart Restaurant</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-gray-500">Sign up for free to manage your orders.</p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <Input type="email" value={email} placeholder="name@example.com" setState={setEmail} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <Input type="text" value={fullName} placeholder="John Doe" setState={setFullName} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <Input type="password" value={password} placeholder="Create a password" setState={setPassword} />
                        </div>

                        <div className={`min-h-[24px] text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                            {log.content}
                        </div>

                        <div className="text-xs text-gray-500 mb-2">
                            By creating an account, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                        </div>

                        <Button 
                            backgrond={{ normal: "#1a1a1a", hover: "#800020" }} 
                            color="#fff" 
                            text="Create Account" 
                            onClick={handleSubmit}
                        />
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Already have an account? 
                        <Link to="/auth/login" className="ml-1 font-bold text-[#800020] hover:underline">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}