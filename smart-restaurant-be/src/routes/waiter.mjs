import { Router } from "express";
import waiterController from "../controllers/WaiterController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware); // Bắt buộc login

// Định nghĩa các endpoint cho Waiter
router.get('/orders', waiterController.getPendingOrders);
router.patch('/orders/:id/status', waiterController.updateOrderStatus);
router.get('/tables', waiterController.getTableStatus);
router.post('/checkout/:sessionId', waiterController.confirmPayment);

export default router;