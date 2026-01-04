import Review from "../models/Review.mjs";
import MenuItem from "../models/MenuItem.mjs";
import Restaurant from "../models/Restaurant.mjs";
import mongoose from 'mongoose';

class ReviewController {

    // Helper: Cập nhật rating món ăn 
    updateMenuItemRating = async (menuItemId) => {
        const objectId = mongoose.Types.ObjectId.isValid(menuItemId) 
            ? new mongoose.Types.ObjectId(menuItemId) 
            : menuItemId;

        const stats = await Review.aggregate([
            { $match: { menuItemId: objectId, reviewType: 'menu_item' } },
            { $group: { _id: "$menuItemId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        if (stats.length > 0) {
            await MenuItem.findByIdAndUpdate(menuItemId, {
                averageRating: Math.round(stats[0].avgRating * 10) / 10,
                totalReviews: stats[0].count
            });
        } else {
            await MenuItem.findByIdAndUpdate(menuItemId, { averageRating: 0, totalReviews: 0 });
        }
    }

    // Helper: Cập nhật rating nhà hàng 
    updateRestaurantRating = async (restaurantId) => {
        const reviews = await Review.find({ restaurantId, reviewType: 'restaurant' });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        await Restaurant.findByIdAndUpdate(restaurantId, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews
        });
    }
    
    // [GET] /api/reviews/:restaurantId/item/:itemId 
    getReviews = async (req, res) => {
        try {
            const { restaurantId, itemId } = req.params;

            const reviews = await Review.find({ 
                restaurantId, 
                menuItemId: itemId,
                reviewType: 'menu_item'
            })
                .populate('userId', 'fullName') // ✅ Populate fullName từ User
                .sort({ createdAt: -1 });

            res.status(200).json({ reviews });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/reviews/:restaurantId/restaurant
    getRestaurantReviews = async (req, res) => {
        try {
            const { restaurantId } = req.params;

            const reviews = await Review.find({ 
                restaurantId,
                reviewType: 'restaurant'
            })
                .populate('userId', 'fullName') // ✅ Populate fullName từ User
                .sort({ createdAt: -1 });

            res.status(200).json({ reviews });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/reviews
    addReview = async (req, res) => {
        try {
            const { restaurantId, menuItemId, reviewType, rating, comment } = req.body;

            // ✅ Validate - BẮT BUỘC phải login
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "You must login to leave a review" });
            }

            if (!restaurantId || !reviewType || !rating || !comment) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            if (reviewType === 'menu_item' && !menuItemId) {
                return res.status(400).json({ message: "Menu item ID is required for menu item reviews" });
            }

            // Check user đã review chưa
            const query = { restaurantId, userId: req.user.id, reviewType };
            if (reviewType === 'menu_item') {
                query.menuItemId = menuItemId;
            }

            const existingReview = await Review.findOne(query);
            if (existingReview) {
                return res.status(400).json({ message: "You have already reviewed this" });
            }

            // Tạo review - ✅ BỎ customerName
            const reviewData = {
                restaurantId,
                reviewType,
                userId: req.user.id, // ✅ BẮT BUỘC
                rating,
                comment
            };
            
            if (reviewType === 'menu_item') {
                reviewData.menuItemId = menuItemId;
            }
            
            const review = await Review.create(reviewData);

            // Update rating
            if (reviewType === 'menu_item') { 
                await this.updateMenuItemRating(menuItemId);
            } else {
                await this.updateRestaurantRating(restaurantId);
            }

            const populatedReview = await Review.findById(review._id)
                .populate('userId', 'fullName'); // ✅ Populate fullName

            res.status(201).json({ message: "Review added", review: populatedReview });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/reviews/:id
    updateReview = async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;

            const review = await Review.findById(id);
            if (!review) return res.status(404).json({ message: "Review not found" });

            // Check ownership
            if (review.userId?.toString() !== req.user?.id) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            review.rating = rating;
            review.comment = comment;
            await review.save();

            // Update rating
            if (review.reviewType === 'menu_item') {
                await this.updateMenuItemRating(review.menuItemId);
            } else {
                await this.updateRestaurantRating(review.restaurantId);
            }

            const populatedReview = await Review.findById(id)
                .populate('userId', 'fullName'); // ✅ Populate fullName

            res.status(200).json({ message: "Review updated", review: populatedReview });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/reviews/:id
    deleteReview = async (req, res) => {
        try {
            const { id } = req.params;

            const review = await Review.findById(id);
            if (!review) return res.status(404).json({ message: "Review not found" });

            // Check ownership
            if (review.userId?.toString() !== req.user?.id) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            const menuItemId = review.menuItemId;
            const restaurantId = review.restaurantId;
            const reviewType = review.reviewType;

            await Review.findByIdAndDelete(id);

            // Update rating
            if (reviewType === 'menu_item') {
                await this.updateMenuItemRating(menuItemId);
            } else {
                await this.updateRestaurantRating(restaurantId);
            }

            res.status(200).json({ message: "Review deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new ReviewController();