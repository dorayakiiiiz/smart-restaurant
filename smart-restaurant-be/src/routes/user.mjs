import { Router } from "express";
import userController from "../controllers/UserController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

router.use(authMiddleware);

router.get('/account', userController.getAccount);
router.patch('/info', userController.updateAccountInfo);
router.delete('/account', userController.deleteAccount);
router.patch('/password', userController.changePassword);

export default router;