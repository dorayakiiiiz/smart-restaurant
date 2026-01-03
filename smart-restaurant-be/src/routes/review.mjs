import express from "express";
import reviewController from "../controllers/ReviewController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = express.Router();

// Public routes (có thể xem review mà không cần login)
router.get('/:restaurantId/item/:itemId', reviewController.getReviews);
router.get('/:restaurantId/restaurant', reviewController.getRestaurantReviews);

// Protected routes (BẮT BUỘC login mới review được)
router.use(authMiddleware); // ✅ BẮT BUỘC authMiddleware
router.post('/', reviewController.addReview);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

export default router;