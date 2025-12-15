import { Router } from "express";
import staffController from "../controllers/StaffController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

// Bắt buộc phải đăng nhập mới được tạo staff
router.use(authMiddleware);

// TODO: Sau này nên thêm middleware checkRole('admin') để đảm bảo chỉ chủ quán mới dc tạo
router.post('/', staffController.createStaff);

export default router;