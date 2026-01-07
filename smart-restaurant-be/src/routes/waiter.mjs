import { Router } from "express";
import waiterController from "../controllers/WaiterController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware); // Bắt buộc login

// Định nghĩa các endpoint cho Waiter
router.get("/orders/all", waiterController.getAllOrders); // GET /orders/all - Lấy tất cả orders (Admin)
router.get("/orders", waiterController.getOrdersByStatus); // GET /orders?status=pending|accepted|ready
router.patch("/orders/:id/status", waiterController.updateOrderStatus); // Update order status (accept/reject)
router.patch("/orders/:id/serve", waiterController.markAsServed); // Mark as served
router.patch("/orders/:id/complete", waiterController.markOrderComplete); // Mark order complete
router.get("/tables", waiterController.getTableStatus);
router.post("/checkout/:sessionId", waiterController.confirmPayment);
router.get("/session/:sessionId/bill", waiterController.downloadBill); // Download

export default router;
