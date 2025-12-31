import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { reviewService } from "../../services/reviewService";
import { useCart } from "../../context/CartContext";
import Button from "../../components/Shared/Button";
import ProductModal from "../../components/Modal/ProductModal";
import { useAuth } from "../../context/AuthContext";

// Component hiển thị sao
const StarRating = ({ rating, setRating, editable = true }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i 
                    key={star}
                    onClick={() => editable && setRating(star)}
                    className={`fa-solid fa-star text-sm transition-colors ${editable ? 'cursor-pointer' : ''} ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                ></i>
            ))}
        </div>
    );
};

export default function MenuDetailPage() {
    const { id, restaurantId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToCart, sessionInfo } = useCart();

    // State cho Review
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);

    const { user } = useAuth();
    console.log("Current User:", user);

    // Fetch item detail
    const { data, isLoading, error } = useQuery({
        queryKey: ['menuItem', id],
        queryFn: () => menuService.getMenuItem(id, restaurantId)
    });

    // Fetch reviews
    const { data: reviews = [] } = useQuery({
        queryKey: ['reviews', restaurantId, id],
        queryFn: () => reviewService.getReviews(restaurantId, id),
        enabled: !!id
    });

    const item = data?.item;

    // Mutations
    const addReviewMutation = useMutation({
        mutationFn: (newReview) => reviewService.addReview(newReview),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', restaurantId, id]);
            queryClient.invalidateQueries(['menuItem', id]);
            setComment("");
            setRating(5);
            alert("Review submitted!");
        },
        onError: (err) => alert(err.response?.data?.message || "Failed to submit review")
    });

    const updateReviewMutation = useMutation({
        mutationFn: ({ id, data }) => reviewService.updateReview(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', restaurantId, id]);
            queryClient.invalidateQueries(['menuItem', id]);
            setEditingReviewId(null);
            setComment("");
            setRating(5);
        }
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', restaurantId, id]);
            queryClient.invalidateQueries(['menuItem', id]);
        }
    });

    // Hàm xử lý gửi form đánh giá
    const handleSubmitReview = () => {
        if (!sessionInfo?.session?._id) {
            alert("Session expired. Please scan QR again.");
            return;
        }
        //Nếu đang sửa đánh giá
        if (editingReviewId) {
            updateReviewMutation.mutate({
                id: editingReviewId,
                data: { rating, comment }
            });

        }
        //Nếu đang thêm đánh giá mới
         else {
            addReviewMutation.mutate({
                menuItemId: item._id,
                restaurantId: restaurantId,
                sessionId: sessionInfo.session._id,
                userId: user.id || user._id, // Đảm bảo dùng _id
                customerName: user.fullName, // Gửi kèm tên
                rating,
                comment
            });
        }
    };

    // Hàm xử lý khi nhấn nút sửa đánh giá, giữ các giá trị cũ
    const handleEditClick = (review) => {
        setEditingReviewId(review._id);
        setRating(review.rating);
        setComment(review.comment);
        setCustomerName(review.customerName);
        document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
    };

    // Phân loại review của mình và người khác
// 2. Sửa logic phân loại Review (QUAN TRỌNG)
const currentUserId = user?.id || user?._id;

// So sánh ID phải so sánh string với string
const myReview = reviews.find(r => {
    const reviewUserId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
    return reviewUserId === currentUserId;
});

// Lọc các review của người khác
const otherReviews = reviews.filter(r => {
    const reviewUserId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
    return reviewUserId !== currentUserId;
});


    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (error || !item) return <div className="p-10 text-center text-red-500">Item not found</div>;

    return (
        <div className="font-quicksand max-w-6xl mx-auto pb-10 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-[#1a1a1a]">{item.name}</h1>
                    <div className="">
                        <p className="text-gray-500 text-sm md:texxt-lg flex items-center gap-2">
                            <span className="text-sm md:text-xl">Category: {item.categoryId?.name}</span>
                            {item.isChefRecommended && (
                                <span className="bg-[#D4AF37] text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    Chef's Choice
                                </span>
                            )}
                        </p>

                    </div>
                </div>
                <div className="">
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
                </div>
                
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide">
                    {item.images?.map((img) => (
                        <div key={img._id} className="relative group w-[80vw] md:w-[500px] h-[350px] flex-shrink-0 snap-center rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                            <img src={img.url} alt="Menu" className="w-full h-full object-cover" />

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
            {/* REVIEWS SECTION */}
            <section id="review-form" className="flex-">
                <div className="flex flex-row md:items-center justify-between gap-4 my-5">
                    <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight">Guest Reviews</h3>
                    
                    {/* Review Stat Card */}
                    <div className="flex items-center gap-6 bg-gradient-to-br from-white to-gray-50 px-8 py-5 rounded-2xl shadow-md border border-gray-100">
                        <div className="text-center border-r border-gray-200 pr-6">
                            <span className="block text-4xl font-extrabold text-[#D4AF37] leading-none">{item.averageRating || "0.0"}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Average</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="mb-1">
                                <StarRating rating={Math.round(item.averageRating || 0)} editable={false} />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                Based on <span className="font-bold text-gray-800">{item.totalReviews || 0}</span> reviews
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Review */}
                {/* Có đăng nhập mới cho review */}
                {user ? (
                    (!myReview || editingReviewId) ? (
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-[#D4AF37]/5 mb-10">
                            <h4 className="font-black text-gray-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-quote-left text-[#D4AF37]"></i>
                                {editingReviewId ? 'Modify Opinion' : 'Write a Review'}
                            </h4>
                            <div className="space-y-5">
                                {!editingReviewId && (
                                    <input 
                                        type="text" 
                                        placeholder="Your Signature Name" 
                                        className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] outline-none transition-all font-bold text-sm"
                                        value={user.fullName || customerName}
                                        onChange={e => setCustomerName(e.target.value)}                    
                                    />
                                )}
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Star Impression</span>
                                    <StarRating rating={rating} setRating={setRating} size="text-2xl" />
                                </div>
                                <textarea 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] outline-none transition-all font-medium text-sm"
                                    rows="4"
                                    placeholder="Describe your culinary journey..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                ></textarea>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleSubmitReview}
                                        className="flex-1 bg-[#1a1a1a] text-[#D4AF37] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black hover:shadow-2xl transition-all active:scale-95"
                                    >
                                        {editingReviewId ? 'Confirm Updates' : 'Publish Review'}
                                    </button>
                                    {editingReviewId && (
                                        <button onClick={() => { setEditingReviewId(null); setComment(""); setRating(5); }} className="px-6 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase hover:bg-gray-200">Cancel</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : 
                    (
                    // Trường hợp 2: Đã có review rồi (Hiển thị thông báo thay vì để trống)
                    <div className="mb-10 p-8 bg-[#fdfaf3] rounded-[2rem] border border-[#D4AF37]/20 text-center shadow-sm">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#D4AF37]">
                            <i className="fa-solid fa-circle-check text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Review Captured!</h4>
                        <p className="text-gray-500 text-sm mb-4">
                            You have already shared your thoughts on this item. <br/>
                            Thank you for your feedback!
                        </p>
                        <button 
                            onClick={() => document.getElementById('my-review-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:underline"
                        >
                            View your feedback below
                        </button>
                    </div>
                    )
                ) : (
                    <div className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#D4AF37]">
                            <i className="fa-solid fa-user-lock text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Want to share your experience?</h4>
                        <p className="text-gray-500 text-sm mb-6">Please sign in to leave a review for this item.</p>
                        <button 
                            onClick={() => navigate('/auth/system/login')}
                            className="px-6 py-2.5 bg-[#1a1a1a] text-[#D4AF37] rounded-xl font-bold text-sm hover:bg-black transition-colors"
                        >
                            Sign In Now
                        </button>
                    </div>
                )}

                {/* List Review */}
                <div className="space-y-6">
                    {myReview && !editingReviewId && (
                        <div className="bg-[#FFF8E1]/40 p-6 rounded-[2rem] border-2 border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-tighter">Your Review</div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-black text-xs">{myReview.customerName[0]}</div>
                                    <span className="font-black text-gray-900 uppercase text-xs tracking-tight">{myReview.customerName}</span>
                                </div>
                                <StarRating rating={myReview.rating} editable={false} />
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{myReview.comment}"</p>
                            <div className="flex gap-3 border-t border-[#D4AF37]/10 pt-4 mt-2">
                                <button 
                                    onClick={() => handleEditClick(myReview)} 
                                    className="flex items-center gap-2 px-4 py-2 bg-[#f8f9fa] text-[#495057] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                                >
                                    <i className="fa-solid fa-pen"></i> Edit
                                </button>
                                <button 
                                    onClick={() => deleteReviewMutation.mutate(myReview._id)} 
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50/50 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                                >
                                    <i className="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {otherReviews.length > 0 ? otherReviews.map(review => (
                        <div key={review._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {review.userId?.avatar ? (
                                        <img src={review.userId.avatar} alt={review.customerName} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center font-black text-xs">{review.customerName[0]}</div>
                                    )}
                                    <div>
                                        <span className="font-bold text-gray-800 block text-sm tracking-tight">{review.customerName}</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Verified Guest</span>
                                    </div>
                                </div>
                                <StarRating rating={review.rating} editable={false} />
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-13 italic">"{review.comment}"</p>
                        </div>
                    )) : !myReview && (
                        <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-inner">
                            <i className="fa-solid fa-feather text-[#D4AF37]/20 text-5xl mb-4"></i>
                            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Be the first to leave an impression</p>
                        </div>
                    )}
                </div>
            </section>
            {/* 4. Nút Add to Cart - ĐẶT Ở ĐÂY (Con trực tiếp của div ngoài cùng) */}
            <button
                onClick={() => setIsModalOpen(true)}
                disabled={!item.isAvailable}
                className={`fixed top-3 right-2 -translate-x-1/2 px-2 md:px-4 py-4 text-sm md:text-lg rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all font-bold text-white z-50 whitespace-nowrap active:scale-95
                    ${item.isAvailable 
                        ? 'bg-[#D4AF37] hover:bg-[#b8912e] opacity-100' 
                        : 'bg-gray-400 cursor-not-allowed opacity-80'}
                `}
            >
                {item.isAvailable ? (
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-cart-plus"></i>
                        Add to Cart
                    </div>
                ) : 'Sold Out'}
            </button>
            {isModalOpen && (
                <ProductModal 
                    item={item} 
                    onClose={() => setIsModalOpen(false)} 
                    onAddToCart={addToCart} 
                />
            )}
        </div>
    );
}