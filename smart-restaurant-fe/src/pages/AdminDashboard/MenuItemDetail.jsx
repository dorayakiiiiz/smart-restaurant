import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import Button from "../../components/Shared/Button";

export default function MenuItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Fetch item detail
    const { data, isLoading, error } = useQuery({
        queryKey: ['menuItem', id],
        queryFn: () => menuService.getMenuItem(id)
    });

    const item = data?.item;
    console.log("Menu Item Detail:", item);

    // Mutations
    const uploadPhotosMutation = useMutation({
        mutationFn: (formData) => menuService.updateMenuItem(id, formData),
        onSuccess: () => queryClient.invalidateQueries(['menuItem', id])
    });

    const deletePhotoMutation = useMutation({
        mutationFn: (imageId) => menuService.deleteMenuImage(id, imageId),
        onSuccess: () => queryClient.invalidateQueries(['menuItem', id])
    });

    const setPrimaryPhotoMutation = useMutation({
        mutationFn: (imageId) => menuService.setPrimaryImage(id, imageId),
        onSuccess: () => queryClient.invalidateQueries(['menuItem', id])
    });

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            //Chèn thêm nhiều ảnh
            formData.append("images", files[i]);
        }

        setUploading(true);
        try {
            await uploadPhotosMutation.mutateAsync(formData);
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (error || !item) return <div className="p-10 text-center text-red-500">Item not found</div>;

    return (
        <div className="font-quicksand max-w-6xl mx-auto pb-10 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-[#1a1a1a]">{item.name}</h1>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <span>Category: {item.categoryId?.name}</span>
                        {item.isChefRecommended && (
                            <span className="bg-[#D4AF37] text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                <i className="fa-solid fa-hat-chef"></i> Chef's Choice
                            </span>
                        )}
                    </p>
                </div>
                <div className="ml-auto">
                     <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>

            {/* Image Slider */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-xl text-gray-800">Gallery</h3>
                    <label className="cursor-pointer bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors flex items-center gap-2 shadow-lg shadow-gray-200">
                        <i className="fa-solid fa-upload"></i>
                        {uploading ? "Uploading..." : "Add Photos"}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
                
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide">
                    {item.images?.map((img) => (
                        <div key={img._id} className="relative group w-[80vw] md:w-[500px] h-[350px] flex-shrink-0 snap-center rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                            <img src={img.url} alt="Menu" className="w-full h-full object-cover" />
                            
                            {/* Primary Badge */}
                            {img.isPrimary && (
                                <div className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md z-10">
                                    Primary Image
                                </div>
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                {!img.isPrimary && (
                                    <button 
                                        onClick={() => setPrimaryPhotoMutation.mutate(img._id)}
                                        className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-[#D4AF37] hover:text-white transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Set as Primary
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        if(window.confirm("Delete this photo?")) deletePhotoMutation.mutate(img._id);
                                    }}
                                    className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}

                    {(!item.images || item.images.length === 0) && (
                        <div className="w-full md:w-[500px] h-[350px] flex-shrink-0 snap-center rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <i className="fa-regular fa-images text-4xl mb-3"></i>
                            <p>No photos available</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="font-bold text-lg mb-4 border-b border-gray-100 pb-2">Information</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Price</label>
                                <p className="text-3xl font-bold text-[#D4AF37] mt-1">${item.price.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Preparation Time</label>
                                <div className="flex items-center gap-2 mt-1 text-gray-700 font-medium">
                                    <i className="fa-regular fa-clock text-gray-400"></i> 
                                    <span>{item.prepTime} minutes</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Description</label>
                                <p className="text-gray-600 text-sm leading-relaxed mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {item.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Modifiers */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#f7f8f6] flex items-center justify-center text-[#D4AF37]">
                                <i className="fa-solid fa-layer-group text-xl"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">Modifiers & Options</h3>
                                <p className="text-xs text-gray-400">Customization options for this item</p>
                            </div>
                        </div>

                        {item.modifiers && item.modifiers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {item.modifiers.map((group, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#D4AF37] transition-colors group">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <span className="font-bold text-gray-800">{group.name}</span>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white border border-gray-200 rounded text-gray-500">
                                                    {group.selectionType}
                                                </span>
                                                {group.isRequired && (
                                                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-red-50 text-red-500 border border-red-100 rounded">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {group.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">{opt.name}</span>
                                                    <span className={`font-medium ${opt.priceAdjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {opt.priceAdjustment > 0 ? `+$${opt.priceAdjustment.toFixed(2)}` : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                <i className="fa-solid fa-ban text-gray-300 text-4xl mb-3"></i>
                                <p className="text-gray-400 font-medium">No modifiers configured</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}