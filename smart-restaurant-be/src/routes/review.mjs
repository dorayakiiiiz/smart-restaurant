import express from "express";
import ReviewController from "../controllers/ReviewController.mjs";

const router = express.Router();

router.get("/:restaurantId/:menuItemId", ReviewController.getReviews);
router.post("/", ReviewController.addReview);
router.put("/:id", ReviewController.updateReview);
router.delete("/:id", ReviewController.deleteReview);

export default router;