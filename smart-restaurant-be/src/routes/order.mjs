import { Router } from "express";
import orderController from "../controllers/OrderController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import optionalAuthMiddleware from "../middleware/OptionalAuthMiddleware.mjs"; // Import mới

const router = Router();

router.post('/session/start', orderController.startSession);

router.post('/', optionalAuthMiddleware, orderController.placeOrder);

router.get('/session/:sessionId', orderController.getSessionDetails);
router.post('/session/:sessionId/checkout', orderController.requestCheckout);

// Claim session khi login
router.post('/session/:sessionId/claim', authMiddleware, orderController.claimSession);
router.get('/history', authMiddleware, orderController.getCustomerHistory);

export default router;