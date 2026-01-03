import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { restaurantService } from "../../services/restaurantService";
import { reviewService } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

// Component StarRating (giống MenuDetailPage)
const StarRating = ({ rating, setRating, editable = true }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i 
                    key={star}
                    onClick={() => editable && setRating(star)}
                    className={`fa-solid fa-star text-lg transition-colors ${editable ? 'cursor-pointer' : ''} ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                ></i>
            ))}
        </div>
    );
};

export default function RestaurantProfilePage() {
    const { sessionInfo } = useCart();
    const navigate = useNavigate();
    const restaurantId = sessionInfo?.restaurant?._id;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // State cho Review Form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [showAllReviews, setShowAllReviews] = useState(false);

    // Fetch restaurant data
    const { data: restaurant, isLoading } = useQuery({
        queryKey: ['restaurant-profile', restaurantId],
        queryFn: () => restaurantService.getPublicRestaurant(restaurantId),
        enabled: !!restaurantId
    });

    // Fetch restaurant reviews
    const { data: reviews = [] } = useQuery({
        queryKey: ['restaurant-reviews', restaurantId],
        queryFn: () => reviewService.getRestaurantReviews(restaurantId),
        enabled: !!restaurantId
    });

    const resto = restaurant?.restaurant;

    // Mutations
    const addReviewMutation = useMutation({
        mutationFn: (newReview) => reviewService.addReview(newReview),
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurant-reviews', restaurantId]);
            queryClient.invalidateQueries(['restaurant-profile', restaurantId]);
            setRating(5);
            setComment("");
            alert("Review submitted successfully!");
        },
        onError: (err) => alert(err.response?.data?.message || "Failed to submit review")
    });

    const updateReviewMutation = useMutation({
        mutationFn: ({ id, data }) => reviewService.updateReview(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurant-reviews', restaurantId]);
            queryClient.invalidateQueries(['restaurant-profile', restaurantId]);
            setEditingReviewId(null);
            setRating(5);
            setComment("");
            alert("Review updated!");
        }
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurant-reviews', restaurantId]);
            queryClient.invalidateQueries(['restaurant-profile', restaurantId]);
            alert("Review deleted!");
        }
    });

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
            addReviewMutation.mutate({
                restaurantId,
                reviewType: 'restaurant',
                rating,
                comment
            });
        }
    };

    const handleEditClick = (review) => {
        setEditingReviewId(review._id);
        setRating(review.rating);
        setComment(review.comment);
        document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Phân loại review
    const currentUserId = user?.id || user?._id;
    const myReview = currentUserId ? reviews.find(r => {
        const reviewUserId = r.userId?._id?.toString() || r.userId?.toString();
        return reviewUserId === currentUserId.toString();
    }) : null;

    const otherReviews = currentUserId ? reviews.filter(r => {
        const reviewUserId = r.userId?._id?.toString() || r.userId?.toString();
        return reviewUserId !== currentUserId.toString();
    }) : reviews;

    const displayedReviews = showAllReviews ? otherReviews : otherReviews.slice(0, 3);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-10">
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

                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900tracking-tight leading-tight">
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

                    

                    {/* Stats Grid - HIỂN THỊ THẬT */}
                    <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                        <div className="text-center">
                            <div className="text-2xl font-black text-[#D4AF37]">
                                {resto?.averageRating?.toFixed(1) || "0.0"}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Rating</div>
                        </div>
                        <div className="text-center border-x border-gray-200">
                            <div className="text-2xl font-black text-blue-600">
                                {resto?.totalReviews || 0}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Reviews</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-blue-600">
                                {resto?.totalOrders || 0}
                            </div>
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

                {/* Contact Info */}
                {(resto?.contact?.phone || resto?.contact?.email) && (
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Links */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
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

            {/* REVIEWS SECTION */}
            <section id="review-form" className="px-4 mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h3 className="font-black text-3xl text-gray-800 uppercase tracking-tight">Guest Reviews</h3>
                    
                    {/* Review Stat Card */}
                    <div className="flex items-center gap-8 bg-gradient-to-br from-white via-gray-50 to-white px-8 py-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80">
                        <div className="text-center border-r border-gray-200 pr-8">
                            <span className="block text-5xl font-black text-[#D4AF37] leading-none">
                                {resto?.averageRating?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em] mt-2 block">Average Rating</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="mb-2">
                                <StarRating rating={Math.round(resto?.averageRating || 0)} editable={false} />
                            </div>
                            <span className="text-xs text-gray-500 font-semibold">
                                <span className="font-black text-gray-800">{resto?.totalReviews || 0}</span> customer opinions
                            </span>
                        </div>
                    </div>
                </div>

                {/* Review Form */}
                {user ? (
                    (!myReview && !editingReviewId && (
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-6">
                            <h4 className="font-black text-gray-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-quote-left text-[#D4AF37]"></i>
                                Share your experience
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
    
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={addReviewMutation.isPending}
                                    className="w-full bg-[#1a1a1a] text-[#D4AF37] px-6 py-4 rounded-2xl font-black uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#D4AF37]">
                            <i className="fa-solid fa-user-lock text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Want to share your experience?</h4>
                        <p className="text-gray-500 text-sm mb-6">Please sign in to leave a review for this item.</p>
                        <button 
                            onClick={() => navigate('/auth/login')}
                            className="px-6 py-2.5 bg-[#1a1a1a] text-[#D4AF37] rounded-xl font-bold text-sm hover:bg-black transition-colors"
                        >
                            Sign In Now
                        </button>
                    </div>

                )}

                {/* Edit Form */}
                {editingReviewId && (
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-[#D4AF37]/30 mb-6">
                        <h4 className="font-black text-xl mb-6 text-gray-800">Edit Your Review</h4>
                        
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
                                    disabled={updateReviewMutation.isPending}
                                    className="flex-1 bg-[#1a1a1a] text-[#D4AF37] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black hover:shadow-2xl transition-all active:scale-95"
                                >
                                    {updateReviewMutation.isPending ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingReviewId(null);
                                        setRating(5);
                                        setComment("");
                                    }}
                                    className="px-6 py-3 bg-gray-200 rounded-2xl font-bold text-gray-700"
                                >
                                Cancel
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* List Reviews */}
                <div className="space-y-5">
                    {/* My Review */}
                    {myReview && !editingReviewId && (
                        <div className="bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E1] p-7 rounded-[2rem] border-2 border-[#D4AF37]/30 shadow-[0_8px_25px_rgba(212,175,55,0.12)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#1a1a1a] text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-[1rem] tracking-[0.2em] shadow-lg">Your Review</div>
                            <div className="flex justify-between items-start mb-5 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C4961F] text-white flex items-center justify-center font-black text-sm shadow-[0_4px_15px_rgba(212,175,55,0.3)]">
                                        {myReview.userId.fullName[0]}
                                    </div>
                                    <div>
                                        <span className="font-black text-gray-900 uppercase text-sm tracking-tight block">{myReview.userId.fullName}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your Opinion</span>
                                    </div>
                                </div>
                                <StarRating rating={myReview.rating} editable={false} />
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-6 italic font-medium">"{myReview.comment}"</p>
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
                    {displayedReviews.length > 0 ? displayedReviews.map(review => (
                        <div key={review._id} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    {review.userId?.avatar ? (
                                        <img src={review.userId.avatar} alt={review.userId.fullName} className="w-11 h-11 rounded-full object-cover shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 flex items-center justify-center font-black text-sm border border-gray-200">
                                            {review.userId.fullName[0]}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-black text-gray-900 block text-sm tracking-tight">{review.userId.fullName}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Guest</span>
                                    </div>
                                </div>
                                <StarRating rating={review.rating} editable={false} />
                            </div>
                            <p className="text-gray-650 text-sm leading-relaxed italic font-medium ml-14">"{review.comment}"</p>
                        </div>
                    )) : !myReview && (
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

                    {/* Show More Button */}
                    {otherReviews.length > 3 && (
                        <button
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                        >
                            {showAllReviews ? 'Show Less' : `Show All ${otherReviews.length} Reviews`}
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}