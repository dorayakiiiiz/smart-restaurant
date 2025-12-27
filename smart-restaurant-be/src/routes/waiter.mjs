import { Router } from "express";
import waiterController from "../controllers/WaiterController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware); // Bắt buộc login

// Định nghĩa các endpoint cho Waiter
router.get('/orders', waiterController.getOrdersByStatus); // GET /orders?status=pending|accepted|ready
router.patch('/orders/:id/status', waiterController.updateOrderStatus); // Update order status (accept/reject)
router.patch('/orders/:id/serve', waiterController.markAsServed); // Mark as served
router.get('/tables', waiterController.getTableStatus);
router.post('/checkout/:sessionId', waiterController.confirmPayment);

export default router;