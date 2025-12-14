import { Router } from "express";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import adminController from "../controllers/AdminController.mjs";

const router = Router();

router.use(authMiddleware);

// Chỉ Super Admin mới được gọi các API này (Cần thêm middleware checkRole('super_admin') sau này cho chặt chẽ)
router.get('/', adminController.getAllRestaurantAdmins); // Lấy list admin
router.post('/', adminController.createRestaurantAdmin); // Tạo admin mới
router.patch('/:id/lock', adminController.toggleRestaurantAdminLock); // Khóa tài khoản admin
router.delete('/:id', adminController.deleteRestaurantAdmin); // Xóa admin
router.get('/stats', adminController.getSystemStats); // Lấy thống kê dashboard

export default router;