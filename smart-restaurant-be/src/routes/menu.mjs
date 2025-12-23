import { Router } from "express";
import { uploadMenu } from "../config/cloudinary.mjs";
import menuController from "../controllers/MenuController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

// Lấy danh sách menu
router.get('/', menuController.getMenu);

// Lấy danh sách thùng rác
router.get('/trash', menuController.getTrashMenu);

// Lấy chi tiết món ăn
router.get('/:id', menuController.getMenuItem);

// Tạo món mới (upload nhiều ảnh - tối đa 10)
router.post('/', uploadMenu.array('images', 10), menuController.createMenuItem);

// Cập nhật món (upload thêm ảnh)
router.patch('/:id', uploadMenu.array('images', 10), menuController.updateMenuItem);

// Khôi phục món ăn
router.patch('/:id/restore', menuController.restoreMenuItem);

// Xóa mềm món ăn
router.delete('/:id', menuController.deleteMenuItem);

// Xóa cứng món ăn
router.delete('/:id/force', menuController.forceDeleteMenuItem);

// Xóa ảnh cụ thể của món
router.delete('/:id/images/:imageId', menuController.deleteMenuImage);

// Set ảnh chính
router.patch('/:id/images/:imageId/primary', menuController.setPrimaryImage);
export default router;