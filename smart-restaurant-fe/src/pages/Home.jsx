import { Link } from "react-router-dom";

export default function Home() {
    return (  
        <div className="w-full">
            {/* Hero Section */}
            <div className="w-full min-h-[calc(100vh-70px)] flex flex-col md:flex-row items-center justify-center px-6 md:px-20 bg-black text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                
                <div className="flex flex-col gap-6 z-10 w-full md:w-1/2 text-center md:text-left">
                    <h1 className="font-momo text-5xl md:text-7xl text-[#D4AF37] font-bold leading-tight">
                        Smart <br/> Restaurant
                    </h1>
                    <p className="font-quicksand text-xl md:text-2xl text-gray-200 md:max-w-lg">
                        The modern operating system for dine-in restaurants. QR Ordering, KDS, and Payments in one flow.
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/auth/system/login"
                            className="inline-block px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-full hover:bg-[#b5952f] transition transform hover:scale-105"
                        >
                            Login to Management Portal
                        </Link> 
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 px-6 md:px-20 bg-gray-50">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#800020] font-momo">Streamline Your Service</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                    {[
                        { title: "QR Ordering", icon: "fa-qrcode", desc: "Customers order directly from their phones." },
                        { title: "Kitchen Display", icon: "fa-fire-burner", desc: "Real-time orders sent straight to the kitchen." },
                        { title: "Easy Payment", icon: "fa-credit-card", desc: "Integrated payments with Stripe, Momo, ZaloPay." }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
                            <div className="w-16 h-16 bg-[#800020] text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                                <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}