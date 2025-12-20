import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";
import { authService } from "../../services/authService"; 
import { Validator } from "../../utils/validators";


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [log, setLog] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login, isLogin } = useAuth();

    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [log]);

    useEffect(() => {
        if (isLogin) {
            navigate('/dashboard');
        }
    }, [isLogin, navigate]);

    // Listen for popup messages (Google/FB)
    useEffect(() => {
        const receiveMessageFromPopUp = async(e) => {
            const { type, payload } = e.data;
            if (type === 'login_success') {
                const { refreshToken, accessToken } = payload;
                
                setLog({
                    type: 'success',
                    content: 'Login successfully! Redirecting...'
                });

                setTimeout(() => {
                    login(refreshToken, accessToken);
                }, 2600);
            }
            else {
                setLog({
                    type: 'error',
                    content: e.data.payload?.message || 'Login failed'
                })
            }
        }
        window.addEventListener('message', receiveMessageFromPopUp)
        return () => window.removeEventListener('message', receiveMessageFromPopUp)
    }, [login, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault();

        // validate data
        const emailError = Validator.validateEmail(email);
        if (emailError) {
            setLog({ type: 'error', content: emailError });
            return;
        }

        const passwordError = Validator.validatePassword(password);
        if (passwordError) {
            setLog({ type: 'error', content: passwordError });
            return;
        }
        
        try {
            setLoading(true);
            const { refreshToken, accessToken } = await authService.login({ email, password });
            
            setLog({
                type: 'success',
                content: 'Login successfully! Redirecting...'
            });

            setTimeout(() => {
                login(refreshToken, accessToken);
            }, 2600);

        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Login failed' });
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="flex w-full min-h-screen bg-white overflow-hidden">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                
                <div className="relative z-10 text-center px-10">
                    <h1 className="font-momo text-6xl text-[#D4AF37] mb-4 drop-shadow-lg">
                        Smart Restaurant
                    </h1>
                    <p className="text-gray-300 text-xl font-light tracking-wider">
                        Experience the future of dining.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 md:px-16 bg-[#fff]">
                <div className="w-full max-w-[450px]">
                    {/* Mobile Logo */}
                    <div className="flex justify-center items-center gap-2 text-2xl md:text-3xl lg:hidden text-center mb-8">
                        <i className="fa-solid fa-utensils text-yellow-600"></i>
                        <h1 className="font-momo text-[#800020] font-bold">Smart Restaurant</h1>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-momo text-gray-900 mb-2">Welcome back</h2>
                        <p className="font-quicksand font-semibold text-gray-500">Login to system management portal.</p>
                    </div>

                    <form className="font-quicksand flex flex-col md:gap-3" onSubmit={handleSubmit}>
                        <div>
                            <label className="block font-bold text-gray-700 md:mb-1">Email</label>
                            <Input 
                                type="email" 
                                value={email} 
                                placeholder="Enter your email" 
                                setState={setEmail}
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 md:mb-1">Password</label>
                            <Input 
                                type="password" 
                                value={password} 
                                placeholder="Enter your password" 
                                setState={setPassword}
                            />
                            <div className="flex justify-end mt-1">
                                <Link 
                                    to="/auth/system/reset-password"
                                    className="text-sm text-[#800020] hover:underline font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Log Message */}
                        <div className={`min-h-[24px] my-2 text-center text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600 success-text' : ''}`}>
                            {log.content}
                        </div>

                        <div className="w-full flex justify-center">
                            <Button 
                                backgrond={{ normal: "#1a1a1a", hover: "#800020" }} 
                                color="#fff" 
                                text={`${!loading ? 'Sign in' : 'Signing in...'}`}
                                disabled={loading}
                                onClick={handleSubmit}
                            />
                        </div>
                    </form>

                    <div 
                        className="flex justify-center my-5 px-2 bg-white text-gray-500"
                    >
                            OR
                    </div>


                    <div className="flex justify-center">
                        <button
                            type="button"
                            className="w-1/2 cursor-pointer flex items-center justify-center py-3 bg-[#ff2821] hover:bg-[#f96666] text-[#fff] font-semibold rounded-3xl"
                            onClick={handleGoogleLogin}
                        >
                            <i className="fa-brands fa-google md:mr-[10px]"></i>
                            <div className="">Continue with Google</div>
                        </button> 
                    </div>

                    {/* <div className="mt-8 text-center font-quicksand text-gray-500">
                        Don't have an account? 
                        <Link to="/auth/system/register" className="ml-1 font-bold text-[#800020] hover:underline">
                            Sign up
                        </Link>
                    </div> */}
                </div>
            </div>
        </div>
    );
}