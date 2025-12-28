import { Router } from "express";
import orderController from "../controllers/OrderController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

// Một số route cần auth (như Guest login ẩn danh), một số có thể public tùy logic
// Tạm thời để authMiddleware để lấy req.user
// router.use(authMiddleware);

router.post('/session/start', orderController.startSession);
router.post('/', orderController.placeOrder);
router.get('/session/:sessionId', orderController.getSessionDetails);
router.post('/session/:sessionId/checkout', orderController.requestCheckout);

export default router;