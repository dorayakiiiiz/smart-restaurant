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

    // CHỈNH SỬA: Chuyển các hàm này thành Arrow Functions
    getReviews = async (req, res) => {
        try {
            const { menuItemId } = req.params;
            const reviews = await Review.find({ menuItemId }).sort({ createdAt: -1 });
            res.status(200).json(reviews);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    addReview = async (req, res) => {
        try {
            const { menuItemId, restaurantId, sessionId, customerName, rating, comment } = req.body;
            
            const newReview = new Review({
                menuItemId, restaurantId, sessionId, customerName, rating, comment
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