import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantService } from "../../services/restaurantService";
import Button from "../../components/Shared/Button";
import Input from "../../components/Shared/Input";

export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const queryClient = useQueryClient();
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [log]);

    // Form State
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [wifi, setWifi] = useState("");
    
    // Contact state (MỚI)
    const [contactPhone, setContactPhone] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    
    // Images
    const [logo, setLogo] = useState(null);
    const [cover, setCover] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [coverPreview, setCoverPreview] = useState("");

    // --- PAYOS STATE (MỚI) ---
    const [payosClientId, setPayosClientId] = useState("");
    const [payosApiKey, setPayosApiKey] = useState("");
    const [payosChecksumKey, setPayosChecksumKey] = useState("");

    const [accountHolder, setAccountHolder] = useState('');

    // --- 1. FETCH DATA (useQuery) ---
    const { data: restaurantData, isLoading } = useQuery({
        queryKey: ['my-restaurant'],
        queryFn: restaurantService.getMyRestaurant,
        staleTime: 5 * 60 * 1000, // Cache 5 phút
    });

    // --- 2. SYNC DATA TO FORM ---
    useEffect(() => {
        if (restaurantData?.restaurant) {
            const r = restaurantData.restaurant;
            setName(r.name || "");
            setAddress(r.address || "");
            setBio(r.bio || "");
            setWifi(r.wifiPassword || "");
            setLogoPreview(r.logoUrl || "");
            setCoverPreview(r.coverUrl || "");

            // Sync PayOS Data
            if (r.payosConfig) {
                setPayosClientId(r.payosConfig.clientId || "");
                setPayosApiKey(r.payosConfig.apiKey || "");
                setPayosChecksumKey(r.payosConfig.checksumKey || "");
                setAccountHolder(r.payosConfig.accountHolder || "");
            }
        }
    }, [restaurantData]);

    // --- 3. UPDATE DATA (useMutation) ---
    const updateMutation = useMutation({
        mutationFn: (formData) => restaurantService.updateRestaurant(formData),
        onSuccess: (data) => {
            // Cập nhật cache của query 'my-restaurant' ngay lập tức
            queryClient.setQueryData(['my-restaurant'], { restaurant: data.restaurant });
            
            // Cập nhật context user
            setUser({ ...user, restaurant: data.restaurant });
            
            setLog({ type: 'success', content: 'Settings updated successfully!' });
            setTimeout(() => setLog({ type: '', content: '' }), 3000);
        },
        onError: (error) => {
            setLog({ type: 'error', content: error.response?.data?.message || 'Failed to update settings.' });
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

    const handleSave = () => {
        if (!name.trim() || !address.trim()) {
            setLog({ type: 'error', content: 'Restaurant name and address are required.' });
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('address', address);
        formData.append('bio', bio);
        formData.append('contactPhone', contactPhone);
        formData.append('contactEmail', contactEmail);
        formData.append('wifiPassword', wifi);
        
        if (logo) formData.append('logo', logo);
        if (cover) formData.append('cover', cover);

        // PayOS Config
        formData.append('payosClientId', payosClientId);
        formData.append('payosApiKey', payosApiKey);
        formData.append('payosChecksumKey', payosChecksumKey);

        updateMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-10 text-center">Loading settings...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-momo">Settings</h2>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
                
                {/* Branding Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Branding & Images</h3>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm font-bold text-gray-500">Logo</span>
                            <div className="w-32 h-32 rounded-full bg-gray-50 border border-gray-200 overflow-hidden relative group">
                                <img src={logoPreview || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                                    <input type="file" onChange={e => handleFileChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-2">
                            <span className="text-sm font-bold text-gray-500">Cover Image</span>
                            <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative group">
                                <img src={coverPreview || "https://via.placeholder.com/800x200"} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                                    <input type="file" onChange={e => handleFileChange(e, 'cover')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">General Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Restaurant Name</label>
                            <Input type="text" value={name} setState={setName} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Address</label>
                            <Input type="text" value={address} setState={setAddress} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Contact Phone</label>
                            <Input type="text" value={contactPhone} setState={setContactPhone} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Contact Email</label>
                            <Input type="text" value={contactEmail} setState={setContactEmail} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-600 mb-1">Bio / Description</label>
                            <textarea 
                                className="w-full p-3 bg-[#f7f8f6] rounded-xl outline-none h-24 resize-none"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Wifi Password (for Guests)</label>
                            <Input type="text" value={wifi} placeholder="Optional" setState={setWifi} />
                        </div>
                    </div>
                </div>

                {/* Payment */}
                <div className="bg-white ">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Payment Configuration - PayOS <span className="ml-1 text-gray-500 text-sm font-normal">(Get via <a href="https://payos.vn" className="cursor-pointer text-blue-500 underline">payos.vn</a>)</span></h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Client ID</label>
                            <Input type="text" value={payosClientId} setState={setPayosClientId} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">API Key</label>
                            <Input type="text" value={payosApiKey} setState={setPayosApiKey} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Checksum Key</label>
                            <Input type="text" value={payosChecksumKey} setState={setPayosChecksumKey} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Account Holder</label>
                    <div className="h-[50px] w-full max-w-[500px] flex items-center my-[10px] rounded-xl bg-[#f7f8f6] px-[20px] cursor-not-allowed text-gray-400">
                        {accountHolder}
                    </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-center pt-4">
                    <div className={`min-h-[24px] mb-2 font-bold text-sm ${
                        log.type === 'error' ? 'text-red-600' : 'text-green-600 success-glow'
                    }`}>
                        {log.content}
                    </div>
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text={isLoading ? "Saving..." : "Save Changes"}
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                    />
                </div>

            </div>
        </div>
    );
}