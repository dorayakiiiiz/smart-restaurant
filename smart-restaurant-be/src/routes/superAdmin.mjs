import { Router } from "express";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import superAdminController from "../controllers/SuperAdminController.mjs";

const router = Router();

router.use(authMiddleware);

// Chỉ Super Admin mới được gọi các API này (Cần thêm middleware checkRole('super_admin') sau này cho chặt chẽ)
router.get('/', superAdminController.getAllRestaurantAdmins); // Lấy list admin
router.post('/', superAdminController.createRestaurantAdmin); // Tạo admin mới
router.patch('/:id', superAdminController.updateRestaurantAdmin); // Cập nhật admin
router.patch('/:id/lock', superAdminController.toggleRestaurantAdminLock); // Khóa tài khoản admin
router.delete('/:id', superAdminController.deleteRestaurantAdmin); // Xóa admin
router.get('/stats', superAdminController.getSystemStats); // Lấy thống kê dashboard

export default router;