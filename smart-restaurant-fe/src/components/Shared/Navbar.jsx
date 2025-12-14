import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const [show, setShow] = useState(true);
    const lastScrollY = useRef(0);
    const { isLogin, logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > lastScrollY.current && window.scrollY > 100) setShow(false);
            else setShow(true);
            lastScrollY.current = window.scrollY;
        }
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogOut = () => {
        logout();
        navigate('/');
    }

    return (
        <nav className={`bg-white/90 backdrop-blur-md fixed left-0 right-0 top-0 h-[70px] px-6 md:px-10 flex justify-between items-center z-50 shadow-sm transition-transform duration-300 ${show ? "translate-y-0" : "-translate-y-full"}`}>
            
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold font-momo text-[#800020]">
                <i className="fa-solid fa-utensils"></i>
                Smart Restaurant
            </Link>

            <div className="flex items-center gap-4">
                {!isLogin ? (
                    <>
                        <Link to="/auth/system/login" className="font-semibold text-gray-700 hover:text-black px-4 py-2">
                            Login to portal
                        </Link>
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-gray-600">
                            Hi, <span className="font-bold text-black">{user?.fullName}</span>
                        </span>
                        <Link to={user?.role === 'super_admin' ? '/super-admin' : '/admin'} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                            Dashboard
                        </Link>
                        <button onClick={handleLogOut} className="text-red-600 font-medium hover:underline">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}