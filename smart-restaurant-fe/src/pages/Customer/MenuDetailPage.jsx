import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { reviewService } from "../../services/reviewService";
import { orderService } from "../../services/orderService";
import { useCart } from "../../context/CartContext";
import Button from "../../components/Shared/Button";
import ProductModal from "../../components/Modal/ProductModal";
import { useAuth } from "../../context/AuthContext";

// Component hiển thị sao
const StarRating = ({ rating, setRating, editable = true, size = "text-sm" }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                let fillPercentage = 0;
                if (rating >= star) {
                    fillPercentage = 100;
                } else if (rating > star - 1) {
                    fillPercentage = (rating - (star - 1)) * 100;
                }

                return (
                    <div 
                        key={star}
                        className={`relative ${editable ? 'cursor-pointer' : ''}`}
                        onClick={() => editable && setRating(star)}
                    >
                        <i className={`fa-solid fa-star ${size} text-gray-300`}></i>

                        <div 
                            className="absolute top-0 left-0 overflow-hidden h-full" 
                            style={{ width: `${fillPercentage}%` }}
                        >
                            <i className={`fa-solid fa-star ${size} text-yellow-400 whitespace-nowrap`}></i>
                        </div>
                    </div>
                );
            })}
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
    const location = useLocation();

    //Lấy page từ URL để giữ trạng thái khi điều hướng
    const page = new URLSearchParams(location.search).get("page");
    const category = new URLSearchParams(location.search).get("category");
    const sortBy = new URLSearchParams(location.search).get("sortBy");

    // State cho Review
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    
    // Filter & Pagination State
    //State lọc đánh giá theo số rating
    const [ratingFilter, setRatingFilter] = useState(0); // 0 = All
    const [showAllReviews, setShowAllReviews] = useState(false);

    const { user } = useAuth();

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

    // Check if user bought and served
    //Ở đây không tự động refetch, chỉ fetchi khi mount
    //Nhưng do khi cus sẽ bấm vào tracking page để xem trạng thái nên khi status là served
    //Thì quay lại revie nênw sẽ thấy luôn nút review hiện lên, không cần socket
    const { data: purchaseStatus } = useQuery({
        queryKey: ['checkServed', id],
        queryFn: () => orderService.checkItemServed(id),
        enabled: !!user && !!id // Chỉ chạy khi đã đăng nhập và có id món
    });

    const hasServedOrder = purchaseStatus?.hasServedOrder;

    const item = data?.item;

    // --- Lấy món cùng danh mục ---
    const { data: menuData } = useQuery({
        queryKey: ['customer-menu', restaurantId],
        queryFn: () => menuService.getMenu(restaurantId),
        enabled: !!restaurantId && !!item
    });

    // Lọc ra các món cùng categoryId nhưng khác ID món hiện tại
    const relatedItems = menuData?.items?.filter(
        i => i.categoryId?._id === item?.categoryId?._id && i._id !== item?._id
    ) || [];

    // Mutations
    const addReviewMutation = useMutation({
        mutationFn: (newReview) => reviewService.addReview(newReview),
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', restaurantId, id]);
            queryClient.invalidateQueries(['menuItem', id]);
            setComment("");
            setRating(5);
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
        if (!user) {
            alert("Please login to leave a review!");
            navigate('/auth/login');
            return;
        }

        if (!comment.trim()) {
            alert("Please write a comment!");
            return;
        }

        if (editingReviewId) {
            updateReviewMutation.mutate({
                id: editingReviewId,
                data: { rating, comment }
            });
        } else {
            // ✅ BỎ customerName
            addReviewMutation.mutate({
                restaurantId,
                menuItemId: id,
                reviewType: 'menu_item',
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
        document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
    };

    // Phân loại review của mình và người khác
    // 2. Sửa logic phân loại Review (QUAN TRỌNG)
    const currentUserId = user?.id || user?._id;

    // So sánh ID phải so sánh string với string
    const myReview = currentUserId ? reviews.find(r => {
        const reviewUserId = r.userId?._id?.toString() || r.userId?.toString();
        return reviewUserId === currentUserId.toString();
    }) : null;

    // Lọc các review của người khác
    const otherReviews = currentUserId ? reviews.filter(r => {
        const reviewUserId = r.userId?._id?.toString() || r.userId?.toString();
        return reviewUserId !== currentUserId.toString();
    }) : reviews;

    // Apply Filter
    const filteredReviews = otherReviews.filter(r => ratingFilter === 0 || r.rating === ratingFilter);

    // Apply Pagination (Limit 3)
    const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

    // Count số review theo từng rating
    const countByRating = (star) => {
        return otherReviews.filter(r => r.rating === star).length;
    }

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;
    if (error || !item) return <div className="p-10 text-center text-red-500">Item not found</div>;

    return (
        <div className="font-quicksand max-w-6xl mx-auto px-4 overflow-x-hidden">

            {/* 1. Navigation */}
            <div className="absolute z-10 mb-6 mt-4" title="Return">
                <button onClick={() => navigate(`/menu?${page ? `page=${page}` : ""}&${category ? `category=${category}` : ""}&${sortBy ? `sortBy=${sortBy}` : ""}`)} className="w-8 h-8 rounded-full text-xs bg-white/80 border border-gray-100 flex items-center justify-center hover:bg-white hover:shadow-md transition-all">
                    <i className="fa-solid fa-arrow-left text-gray-900"></i>
                </button>
                
            </div>

            {/* 2. Image Slider */}
            <div className="mb-10 relative">
                <div className={`flex ${item.images.length === 1 && 'justify-center'} gap-4 -mx-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide`}>
                    {item.images?.map((img) => (
                        <div key={img._id} className="relative w-full aspect-[4/3] flex-shrink-0 snap-center overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white">
                            <img src={img.url} alt="Menu" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                    ))}

                    {(!item.images || item.images.length === 0) && (
                        <div className="w-full md:w-[500px] aspect-[4/3] flex-shrink-0 snap-center rounded-[2.5rem] border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-gray-300">
                            <i className="fa-thin fa-plate-wheat text-5xl mb-4 opacity-50"></i>
                            <p className="text-xs font-bold uppercase tracking-widest">No visual preview</p>
                        </div>
                    )}
                </div>
                
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* LEFT COLUMN: Thông tin chi tiết */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Title & Category */}
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em]">
                                        {item.categoryId?.name || "Signature Dish"}
                                    </span>
                                    {item.isChefRecommended && (
                                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F5E0A3] text-[#1a1a1a] px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                            <i className="fa-solid fa-crown text-[8px]"></i> Chef's Choice
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-[#1a1a1a] leading-tight mb-4">
                                    {item.name}
                                </h1>
                            </div>

                            <div className="">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                                    !item.isSoldOut ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                                }`}>
                                    {!item.isSoldOut ? 'Available' : 'Sold Out'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 -mt-2">
                            <StarRating rating={item.averageRating || 0} editable={false} />
                            <div className="text-yellow-400 text-sm mb-0.5 whitespace-nowrap">({item.totalReviews} reviews)</div>
                        </div>
                        
                        {/* Quick Stats Row */}
                        <div className="flex items-center justify-around gap-6 py-3 border-y border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl shadow-sm bg-green-100 text-green-500 flex items-center justify-center">
                                    <i className="fa-solid fa-dollar-sign text-sm"></i>
                                </div>
                                <div>
                                    <p className="text-gray-800 font-bold">Price</p>
                                    <p className="text-2xl font-bold text-red-500/90">${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                            
                            <div className="w-px h-8 bg-gray-200"></div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 shadow-sm text-blue-500 flex items-center justify-center">
                                    <i className="fa-solid fa-clock text-sm"></i>
                                </div>
                                <div>
                                    <p className="text-gray-800 font-bold">Prep Time</p>
                                    <p className="text-2xl font-bold text-blue-500">{item.prepTime} mins</p>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    {/* Description as "Chef's Note" */}
                    <div className="py-6 px-10 rounded-2xl bg-white border border-gray-100 relative shadow">
                        <i className="fa-solid fa-quote-left text-2xl text-gray-800 absolute -top-3 left-6 px-2"></i>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Chef's Description</h3>
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base italic">
                            {item.description || "A culinary masterpiece prepared with the finest ingredients. Please ask our staff for more details about the taste profile."}
                        </p>
                    </div>

                    {/* 4. Nút Add to Order */}
                    <div className={`${item.isSoldOut && 'hidden'} flex justify-center`}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={item.isSoldOut}
                            className={`
                                group relative w-full md:w-[400px] h-16 rounded-2xl 
                                flex items-center overflow-hidden transition-all duration-300
                                ${item.isAvailable 
                                    ? 'bg-[#1a1a1a] hover:bg-[#D4AF37] shadow-lg active:scale-[0.98]' 
                                    : 'bg-gray-100 cursor-not-allowed'}
                            `}
                        >
                            {item.isAvailable ? (
                                <>
                                    <div className="flex items-center justify-center w-24 h-full border-r border-white/30 group-hover:border-black/10 transition-colors">
                                        <span className="text-yellow-300 group-hover:text-white font-bold text-lg transition-colors">
                                            ${item.price.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center gap-3">
                                        <span className="text-white group-hover:text-black font-black uppercase tracking-[0.2em] text-sm transition-colors">
                                            Add to Order
                                        </span>
                                        <i className="fa-solid fa-arrow-right text-[#D4AF37] group-hover:text-black text-xs transition-colors group-hover:translate-x-1 duration-300"></i>
                                    </div>
                                </>
                            ) : (
                                <span className="w-full text-center font-bold text-gray-400 uppercase tracking-widest text-xs">
                                    Currently Sold Out
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Modifiers */}
                <div className={`lg:col-span-1 ${item.modifiers && item.modifiers.length > 0 ? '' : 'hidden'}`}>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-[#D4AF37] shadow-lg shadow-yellow-900/10">
                                <i className="fa-solid fa-sliders text-lg"></i>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">Customize</h3>
                                <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em]">Personalize your dish</p>
                            </div>
                        </div>

                        {item.modifiers && item.modifiers.length > 0 ? (
                            <div className="space-y-6">
                                {item.modifiers.map((group, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-3 px-1">
                                            <div>
                                                <span className="block text-sm font-black text-gray-800 uppercase tracking-wide">{group.name}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{group.selectionType}</span>
                                            </div>
                                            {group.isRequired && (
                                                <span className="text-[8px] font-black uppercase px-2 py-1 bg-red-50 text-red-500 border border-red-100 rounded-md tracking-tighter">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {group.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-transparent hover:border-[#D4AF37]/30 hover:bg-white hover:shadow-sm transition-all duration-300">
                                                    <span className="text-sm font-medium text-gray-600">{opt.name}</span>
                                                    <span className={`text-xs font-black ${opt.priceAdjustment > 0 ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                                                        {opt.priceAdjustment > 0 ? `+$${opt.priceAdjustment.toFixed(2)}` : 'FREE'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <i className="fa-solid fa-wand-magic-sparkles text-gray-200 text-2xl"></i>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Standard Preparation</p>
                            </div>
                        )}
                    </div>
                </div>

                {relatedItems.length > 0 && (
                    <div className="">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 font-quicksand">You might also like</h3>
                        <div className="flex gap-4 overflow-x-auto pb-6 snap-x no-scrollbar">
                            {relatedItems.map((related) => (
                                <div 
                                    key={related._id}
                                    onClick={() => {
                                        navigate(`/menu/public/${related._id}/${restaurantId}`);
                                        window.scrollTo(0,0);
                                    }}
                                    className="min-w-[160px] w-[160px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-start cursor-pointer hover:shadow-md transition-all duration-300"
                                >
                                    <div className="h-32 w-full bg-gray-100 relative">
                                        <img 
                                            src={related.images?.[0]?.url} 
                                            alt={related.name}
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div className="p-3">
                                        <div className="font-bold text-gray-800 truncate text-sm mb-1">{related.name}</div>
                                        <div className="text-[#D4AF37] font-bold text-sm">${related.price}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
    
            </div>
            {/* REVIEWS SECTION */}
            <section id="review-form" className="">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 my-8">
                    <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight">Guest Reviews</h3>
                    
                    {/* Review Stat Card */}
                    <div className="flex items-center gap-8 bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all">
                        <div className="text-center border-r border-gray-200 pr-4">
                            <span className="block text-4xl font-black text-[#D4AF37] leading-none">{item.averageRating || "0.0"}</span>
                            <span className="text-xs text-gray-400 font-black uppercase tracking-[0.15em] mt-2 block">Average Rating</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="mb-2">
                                <StarRating rating={item.averageRating || 0} editable={false} />
                            </div>
                            <span className="text-sm text-gray-500 font-semibold">
                                <div className="text-gray-400">Base on</div>
                                <span className="font-black text-gray-800">{item.totalReviews || 0}</span> customer opinions
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Review */}
                {/* Có đăng nhập  và đã đc served món đó mới cho review*/}
                {!user && (
                    <div className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#D4AF37]">
                            <i className="fa-solid fa-user-lock text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Want to share your experience?</h4>
                        <p className="text-gray-500 text-sm mb-6">Please sign in and taste the food to leave a review for this item.</p>
                        <button 
                            onClick={() => navigate('/auth/login')}
                            className="px-6 py-2.5 bg-[#1a1a1a] text-[#D4AF37] rounded-xl font-bold text-sm hover:bg-black transition-colors"
                        >
                            Sign In Now
                        </button>
                    </div>
                )}

                {hasServedOrder ? (
                    (!myReview || editingReviewId) && (
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border-2 border-[#D4AF37]/5 mb-10">
                            <h4 className="font-black text-gray-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-quote-left text-[#D4AF37]"></i>
                                {editingReviewId ? 'Modify Opinion' : 'Write a Review'}
                            </h4>
                            <div className="space-y-5">
                                
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">RATING</span>
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
                    ) 
                ) : (
                    <div className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#D4AF37]">
                            <i className="fa-solid fa-user-lock text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Want to share your experience?</h4>
                        <p className="text-gray-500 text-sm mb-6">Want to leave review? Place order now!</p>
                        
                    </div>
                )}

                {/* List Review */}
                <div className="space-y-5 mt-10">
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
                    {myReview && !editingReviewId && (
                        <div className="bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E1] py-6 px-8 rounded-3xl border-2 border-[#D4AF37]/30 shadow-sm relative mb-5">
                            <div className="flex justify-between items-start mb-3 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div 
                                        className={`w-11 h-11 ${myReview.userId?.avatar && 'border-2 border-white'} bg-cover rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C4961F] text-white flex items-center justify-center font-black text-sm shadow-lg`}
                                        style={{
                                            backgroundImage: myReview.userId?.avatar?.url
                                            ? `url(${myReview.userId.avatar.url})`
                                            : undefined,
                                        }}
                                    >
                                        {!myReview.userId?.avatar && myReview.userId?.fullName?.[0]}
                                    </div>
                                    <div>
                                        <span className="font-black text-gray-900 uppercase text-sm tracking-tight block">
                                            {myReview.userId?.fullName || 'User'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your Review</span>
                                    </div>
                                </div>
                                <StarRating rating={myReview.rating} editable={false} />
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-4 italic font-medium">"{myReview.comment}"</p>
                            <div className="flex gap-3 border-t border-[#D4AF37]/20 pt-5">
                                <button 
                                    onClick={() => handleEditClick(myReview)} 
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#495057] rounded-xl text-xs font-black uppercase tracking-[0.15em] border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                                >
                                    <i className="fa-solid fa-pen text-sm"></i> Edit
                                </button>
                                <button 
                                    onClick={() => deleteReviewMutation.mutate(myReview._id)} 
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-rose-400 rounded-xl text-xs font-black uppercase tracking-[0.15em] border border-rose-100 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-all active:scale-95"
                                >
                                    <i className="fa-solid fa-trash text-sm"></i> Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Other Reviews */}
                    {displayedReviews.length > 0 ? (
                        <>
                            {displayedReviews.map(review => (
                                <div key={review._id} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 mb-5">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            {review.userId?.avatar ? (
                                                <img src={review.userId.avatar.url} alt={review.userId.fullName} className="w-11 h-11 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-2 border-gray-400" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 flex items-center justify-center font-black text-sm border border-gray-200">
                                                    {(!review.userId?.avatar && review.userId?.fullName?.[0]) || 'U'}
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
                                        className="group flex items-center gap-2 mx-auto px-8 py-4 mb-1 bg-white border border-gray-200 rounded-full text-xs font-black uppercase tracking-[0.2em] text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all shadow-xs hover:shadow-md active:scale-95"
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
                    ) : !myReview && (
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
                                    Be the first to share your journey
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            
            </section>
            
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