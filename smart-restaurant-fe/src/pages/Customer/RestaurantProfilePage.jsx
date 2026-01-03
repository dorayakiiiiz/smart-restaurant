import { useQuery } from "@tanstack/react-query";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { restaurantService } from "../../services/restaurantService"; // Import service

export default function RestaurantProfilePage() {
    const { sessionInfo } = useCart();
    const navigate = useNavigate();
    const restaurantId = sessionInfo?.restaurant?._id;

    // Fetch restaurant data - Dùng service thay vì fetch thủ công
    const { data: restaurant, isLoading } = useQuery({
        queryKey: ['restaurant-profile', restaurantId],
        queryFn: () => restaurantService.getPublicRestaurant(restaurantId),
        enabled: !!restaurantId
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    const resto = restaurant?.restaurant;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-4">
            {/* Hero Section with Cover */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                {resto?.coverUrl ? (
                    <img 
                        src={resto.coverUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white transition-all shadow-lg"
                >
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
            </div>

            {/* Restaurant Info Card */}
            <div className="px-4 -mt-16 relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                    {/* Logo + Name */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative shrink-0">
                            {resto?.logoUrl ? (
                                <img 
                                    src={resto.logoUrl} 
                                    alt="Logo" 
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                                />
                            ) : (
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C4961F] flex items-center justify-center border-4 border-white shadow-xl">
                                    <i className="fa-solid fa-utensils text-white text-3xl md:text-4xl"></i>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <i className="fa-solid fa-check text-white text-[10px]"></i>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                {resto?.name || "Restaurant"}
                            </h1>
                            {/* Bio/Description */}
                            {resto?.bio && (
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                    {resto.bio}
                                </p>
                            )}
                        </div>
                    </div>

                    

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                        <div className="text-center">
                            <div className="text-2xl font-black text-[#D4AF37]">4.8</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Rating</div>
                        </div>
                        <div className="text-center border-x border-gray-200">
                            <div className="text-2xl font-black text-blue-600">250+</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Reviews</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-green-600">5K+</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Orders</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Sections */}
            <div className="px-4 mt-6 space-y-4">
                {/* Address */}
                {resto?.address && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-location-dot text-blue-600"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 mb-1 text-sm">Location</h3>
                                <p className="text-sm text-gray-600">{resto.address}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* WiFi Password */}
                {resto?.wifiPassword && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-wifi text-purple-600"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 mb-1 text-sm">WiFi Password</h3>
                                <div className="flex items-center gap-3">
                                    <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200">
                                        {resto.wifiPassword}
                                    </code>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(resto.wifiPassword);
                                            alert("Copied to clipboard!");
                                        }}
                                        className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-copy text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Operating Hours (Mock data) */}
                {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-clock text-green-600"></i>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">Operating Hours</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Monday - Friday</span>
                                    <span className="font-semibold text-gray-900">9:00 AM - 10:00 PM</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Saturday - Sunday</span>
                                    <span className="font-semibold text-gray-900">10:00 AM - 11:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Contact Info (Mock) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-phone text-orange-600"></i>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">Contact</h3>
                            <div className="space-y-2 text-sm">
                                {resto?.contact?.phone && (
                                    <a href={`tel:${resto.contact.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition-colors">
                                        <i className="fa-solid fa-phone-volume text-xs"></i>
                                        <span>{resto.contact.phone}</span>
                                    </a>
                                )}
                                {resto?.contact?.email && (
                                    <a href={`mailto:${resto.contact.email}`} className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition-colors">
                                        <i className="fa-solid fa-envelope text-xs"></i>
                                        <span>{resto.contact.email}</span>
                                    </a>
                                )}
                                {!resto?.contact?.phone && !resto?.contact?.email && (
                                    <p className="text-gray-400 italic">No contact information available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Links (Mock) */}
                <div className="mt-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm">Follow Us</h3>
                    <div className="flex gap-3">
                        {['facebook', 'instagram', 'twitter', 'tiktok'].map(social => (
                            <button 
                                key={social}
                                className="w-12 h-12 rounded-xl bg-gray-50 hover:bg-[#D4AF37] hover:text-white text-gray-600 transition-all flex items-center justify-center group"
                            >
                                <i className={`fa-brands fa-${social} text-lg group-hover:scale-110 transition-transform`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}