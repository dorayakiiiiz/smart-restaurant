import Review from "../models/Review.mjs";
import MenuItem from "../models/MenuItem.mjs";

class ReviewController {
    
    // Hàm phụ: Đã là arrow function rồi nên không cần sửa
    _updateMenuItemRating = async (menuItemId) => {
        const stats = await Review.aggregate([
            { $match: { menuItemId: menuItemId } },
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

    //[GET] /reviews/:restaurantId/:menuItemId
    getReviews = async (req, res) => {
        try {
            const {restaurantId, menuItemId } = req.params;
            const reviews = await Review.find({ restaurantId, menuItemId })
                .populate('userId', 'fullName')
                .sort({ createdAt: -1 });
            res.status(200).json(reviews);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    //[POST] /reviews
    addReview = async (req, res) => {
        try {
            const { menuItemId, restaurantId, sessionId, rating, comment, userId, customerName } = req.body;
            
            const newReview = new Review({
                menuItemId, restaurantId, sessionId, rating, comment, userId, customerName: customerName || "Guest" 
            });
            await newReview.save();
            
            // Bây giờ "this" đã xác định đúng là ReviewController
            await this._updateMenuItemRating(newReview.menuItemId);
            
            res.status(201).json(newReview);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: "You have already reviewed this item." });
            }
            res.status(500).json({ message: error.message });
        }
    }

    //[PUT] /reviews/:id
    updateReview = async (req, res) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            
            const updatedReview = await Review.findByIdAndUpdate(
                id, 
                { rating, comment }, 
                { new: true }
            );

            if (!updatedReview) return res.status(404).json({ message: "Review not found" });

            await this._updateMenuItemRating(updatedReview.menuItemId);

            res.status(200).json(updatedReview);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    //[DELETE] /reviews/:id
    deleteReview = async (req, res) => {
        try {
            const { id } = req.params;
            const deletedReview = await Review.findByIdAndDelete(id);
            
            if (!deletedReview) return res.status(404).json({ message: "Review not found" });

            await this._updateMenuItemRating(deletedReview.menuItemId);

            res.status(200).json({ message: "Review deleted" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new ReviewController();