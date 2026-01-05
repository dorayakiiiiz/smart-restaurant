import { Router } from "express";
import staffController from "../controllers/StaffController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

// Bắt buộc phải đăng nhập mới được tạo staff
router.use(authMiddleware);

// TODO: Sau này nên thêm middleware checkRole('admin') để đảm bảo chỉ chủ quán mới dc tạo
router.get('/', staffController.getAllStaff); // Lấy danh sách staff
router.post('/', staffController.createStaff); // Tạo staff mới
router.patch('/:id', staffController.updateStaff); // Cập nhật staff
router.patch('/:id/lock', staffController.toggleLockStaff); // Khóa/mở khóa staff
router.delete('/:id', staffController.deleteStaff); // Xóa staff

export default router;