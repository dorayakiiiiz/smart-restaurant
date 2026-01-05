import { Router } from "express";
import userController from "../controllers/UserController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import { uploadAvatar } from "../config/cloudinary.mjs"; // Import middleware

const router = Router();

router.use(authMiddleware);

router.get('/account', userController.getAccount);
router.patch('/info', uploadAvatar.single('avatar'), userController.updateAccountInfo);
router.delete('/account', userController.deleteAccount);
router.patch('/password', userController.changePassword);

export default router;