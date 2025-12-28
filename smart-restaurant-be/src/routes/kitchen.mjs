import { Router } from "express";
import kitchenController from "../controllers/KitchenController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware); // Bắt buộc login

// Định nghĩa các endpoint cho Kitchen
router.get('/orders', kitchenController.getIncomingOrders);

// Sửa :itemId thành :orderId để khớp với controller và logic frontend
router.patch('/orders/:orderId/status', kitchenController.updateItemStatus);

router.get('/history', kitchenController.getHistory);

export default router;