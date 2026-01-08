import { Router } from "express";
import orderController from "../controllers/OrderController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import optionalAuthMiddleware from "../middleware/OptionalAuthMiddleware.mjs"; // Import mới

const router = Router();

router.post('/session/start', orderController.startSession);

router.post('/', optionalAuthMiddleware, orderController.placeOrder);

router.get('/session/:sessionId', orderController.getSessionDetails);
router.post('/session/:sessionId/checkout', orderController.requestCheckout);

// WEBHOOK PAYOS (Không cần auth middleware vì PayOS gọi)
router.post('/webhook/payos', orderController.handlePayOSWebhook);

// Claim session khi login
router.post('/session/:sessionId/claim', authMiddleware, orderController.claimSession);
router.get('/history', authMiddleware, orderController.getCustomerHistory);

// Check if user has served order for item
router.get('/check-served/:itemId', authMiddleware, orderController.checkItemServed);

export default router;