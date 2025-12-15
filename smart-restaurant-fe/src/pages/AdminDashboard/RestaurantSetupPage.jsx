import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { restaurantService } from "../../services/restaurantService";
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";

export default function RestaurantSetupPage() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [logo, setLogo] = useState(null);
    const [cover, setCover] = useState(null);
    
    // Preview ảnh
    const [logoPreview, setLogoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    // Log State
    const [log, setLog] = useState({ type: '', content: '' });

    // Auto clear log
    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [log.content]);

    // Mutation
    const createMutation = useMutation({
        mutationFn: (formData) => restaurantService.createRestaurant(formData),
        onSuccess: (data) => {
            setLog({ type: 'success', content: 'Restaurant created successfully!' });
            setTimeout(() => {
                const updatedUser = { ...user, restaurant: data.restaurant };
                setUser(updatedUser);
                navigate('/system/admin/dashboard');
            }, 2000);
        },
        onError: (error) => {
            setLog({ type: 'error', content: error.response?.data?.message || "Failed to setup restaurant." });
        }
    });

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'logo') {
                setLogo(file);
                setLogoPreview(URL.createObjectURL(file));
            } else {
                setCover(file);
                setCoverPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim() || !address.trim()) {
            setLog({ type: 'error', content: "Restaurant name and address are required." });
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('bio', bio);
        if (logo) formData.append('logo', logo);
        if (cover) formData.append('cover', cover);

        createMutation.mutate(formData);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-quicksand overflow-hidden">
            
            {/* 1. Background Image & Overlay */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center z-0" />
            <div className="absolute inset-0 backdrop-blur-xs z-0" /> {/* Lớp phủ tối + mờ */}

            {/* 2. Main Card Container */}
            <div className="relative z-10 bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
                
                {/* Left Side: Welcome & Info (Mobile: Top) */}
                <div className="bg-[#1a1a1a] text-white p-8 md:p-10 md:w-1/3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[#D4AF37] mb-6">
                            <i className="fa-solid fa-utensils text-xl text-yellow-600"></i>
                            <span className="font-bold tracking-wider uppercase">Smart Restaurant</span>
                        </div>
                        <h1 className="font-momo text-3xl md:text-4xl leading-tight mb-4 md:mb-10">
                            Welcome, <br/> <span className="text-[#D4AF37]">{user?.fullName}</span>
                        </h1>
                        <p className="text-gray-400 leading-relaxed">
                            Let's create your digital storefront. This information will be displayed to your customers when they scan the QR code.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form (Mobile: Bottom) */}
                <div className="p-8 md:p-10 md:w-2/3 bg-white">
                    <form onSubmit={handleSubmit} className="h-full flex flex-col justify-center">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                            
                            {/* Column 1: Visual Branding (Mockup) */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Branding Preview</label>
                                
                                {/* Mockup Container */}
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group hover:border-[#D4AF37] transition-colors cursor-pointer">
                                    {/* Cover Upload */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {coverPreview ? (
                                            <img src={coverPreview} className="w-full h-full object-cover" alt="Cover" />
                                        ) : (
                                            <div className="text-gray-400 flex flex-col items-center gap-1">
                                                <i className="fa-regular fa-image text-2xl"></i>
                                                <span className="text-xs">Cover Image</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="Upload Cover" />
                                    </div>

                                    {/* Logo Upload (Overlay) */}
                                    <div className="absolute -bottom-4 left-4 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md overflow-hidden z-20 group-hover:scale-105 transition-transform">
                                        <div className="w-full h-full bg-gray-200 relative flex items-center justify-center">
                                            {logoPreview ? (
                                                <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                                            ) : (
                                                <i className="fa-solid fa-camera text-gray-400 text-sm"></i>
                                            )}
                                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" title="Upload Logo" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 italic text-right">* Click large area for Cover, circle for Logo</p>
                            </div>

                            {/* Column 2: Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Name <span className="text-red-500">*</span></label>
                                    <Input type="text" value={name} placeholder="e.g. The Golden Spoon" setState={setName} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                                    <Input type="text" value={address} placeholder="e.g. 123 Main St, NY" setState={setAddress} />
                                </div>
                            </div>
                        </div>

                        {/* Full Width: Bio */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Bio / Slogan</label>
                            <textarea 
                                className="w-full p-3 bg-[#f7f8f6] rounded-xl outline-none h-20 text-sm resize-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                                placeholder="Short description about your restaurant..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Log & Action */}
                        <div className="mt-auto">
                            <div className={`min-h-[20px] text-center font-bold mb-3 ${
                                log.type === 'error' ? 'text-red-600' : 'text-green-600 success-glow'
                            }`}>
                                {log.content}
                            </div>

                            <div className="flex justify-end">
                                <Button 
                                    backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                                    color="#fff"
                                    text={createMutation.isPending ? "Setting up..." : "Launch Restaurant"}
                                    onClick={handleSubmit}
                                    disabled={createMutation.isPending}
                                    className="px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

