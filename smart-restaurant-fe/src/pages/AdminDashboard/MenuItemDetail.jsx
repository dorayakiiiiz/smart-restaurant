import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { reviewService } from "../../services/reviewService";
import Button from "../../components/Shared/Button";

// Component hiển thị sao
const StarRating = ({ rating, setRating, editable = true, size = "text-sm" }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i 
                    key={star}
                    onClick={() => editable && setRating(star)}
                    className={`fa-solid fa-star ${size} transition-colors ${editable ? 'cursor-pointer' : ''} ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                ></i>
            ))}
        </div>
    );
};

export default function MenuItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    
    // Filter & Pagination State for Reviews
    const [ratingFilter, setRatingFilter] = useState(0); // 0 = All
    const [showAllReviews, setShowAllReviews] = useState(false);

    // Fetch item detail
    const { data, isLoading, error } = useQuery({
        queryKey: ['menuItem', id],
        queryFn: () => menuService.getMenuItem(id)
    });

    const item = data?.item;
    console.log("Menu Item Detail:", item);

    // Fetch reviews - Only fetch if item is loaded and has restaurantId
    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', item?.restaurantId, id],
        queryFn: () => reviewService.getReviews(item.restaurantId, id),
        enabled: !!item?.restaurantId && !!id
    });

    // Filter Reviews
    const filteredReviews = reviews.filter(r => ratingFilter === 0 || r.rating === ratingFilter);
    const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);
    const countByRating = (star) => reviews.filter(r => r.rating === star).length;

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
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Orders</label>
                                <div className="flex items-center gap-2 mt-1 text-gray-700 font-medium">
                                    <i className="fa-solid fa-receipt text-gray-400"></i> 
                                    <span>{item.orderCount || 0} orders</span>
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

            {/* REVIEWS SECTION (Read-Only for Admin) */}
            <section id="review-section" className="mt-12 border-t border-gray-100 pt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight">Customer Reviews</h3>
                    
                    {/* Review Stat Card */}
                    <div className="flex items-center gap-8 bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
                        <div className="text-center border-r border-gray-200 pr-4">
                            <span className="block text-4xl font-black text-[#D4AF37] leading-none">{item.averageRating || "0.0"}</span>
                            <span className="text-xs text-gray-400 font-black uppercase tracking-[0.15em] mt-2 block">Average Rating</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="mb-2">
                                <StarRating rating={Math.round(item.averageRating || 0)} editable={false} />
                            </div>
                            <span className="text-sm text-gray-500 font-semibold">
                                <div className="text-gray-400">Based on</div>
                                <span className="font-black text-gray-800">{item.totalReviews || 0}</span> customer opinions
                            </span>
                        </div>
                    </div>
                </div>

                {/* List Review */}
                <div className="space-y-5">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button 
                            onClick={() => { setRatingFilter(0); setShowAllReviews(false); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                                ratingFilter === 0 
                                ? 'bg-[#1a1a1a] text-[#D4AF37] border-[#1a1a1a]' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            All Reviews
                        </button>
                        {[5, 4, 3, 2, 1].map(star => (
                            <button 
                                key={star}
                                onClick={() => { setRatingFilter(star); setShowAllReviews(false); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
                                    ratingFilter === star 
                                    ? 'bg-[#1a1a1a] text-[#D4AF37] border-[#1a1a1a]' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {star} <i className="fa-solid fa-star text-[10px]"></i>
                                <span className="ml-1 text-xs text-gray-400">({countByRating(star)})</span>
                            </button>
                        ))}
                    </div>

                    {/* Reviews List */}
                    {displayedReviews.length > 0 ? (
                        <>
                            {displayedReviews.map(review => (
                                <div key={review._id} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            {review.userId?.avatar ? (
                                                <img src={review.userId.avatar} alt={review.userId.fullName} className="w-11 h-11 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 flex items-center justify-center font-black text-sm border border-gray-200">
                                                    {review.userId?.fullName?.[0] || 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-black text-gray-900 block text-sm tracking-tight">
                                                    {review.userId?.fullName || 'User'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Guest</span>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} editable={false} />
                                    </div>
                                    <p className="text-gray-650 text-sm leading-relaxed italic font-medium ml-13">"{review.comment}"</p>
                                </div>
                            ))}
                            
                            {/* Show All Button */}
                            {filteredReviews.length > 3 && (
                                <div className="text-center pt-6">
                                    <button 
                                        onClick={() => setShowAllReviews(!showAllReviews)}
                                        className="group flex items-center gap-2 mx-auto px-8 py-4 bg-white border-2 border-gray-200 rounded-full text-xs font-black uppercase tracking-[0.2em] text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        {showAllReviews ? (
                                            <>
                                                Show Less 
                                                <i className="fa-solid fa-chevron-up text-[10px] group-hover:-translate-y-0.5 transition-transform"></i>
                                            </>
                                        ) : (
                                            <>
                                                View All {filteredReviews.length} Reviews 
                                                <i className="fa-solid fa-chevron-down text-[10px] group-hover:translate-y-0.5 transition-transform"></i>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-[2rem] border border-gray-100">
                            <div className="relative mb-4">
                                <i className="fa-light fa-feather-pointed text-gray-200 text-5xl"></i>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#D4AF37]/20 rounded-full"></div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-[#1a1a1a] font-bold text-sm tracking-wide">
                                    No reviews yet
                                </p>
                                <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">
                                    No customer has reviewed this item yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}