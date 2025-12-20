import { Router } from "express";
import { uploadMenu } from "../config/cloudinary.mjs";
import menuController from "../controllers/MenuController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

// Áp dụng middleware xác thực cho tất cả các route menu
router.use(authMiddleware);

// Lấy danh sách menu
router.get('/', menuController.getMenu);

// Tạo món mới (có upload ảnh)
router.post('/', uploadMenu.single('image'), menuController.createMenuItem);

// Cập nhật món (có upload ảnh)
router.patch('/:id', uploadMenu.single('image'), menuController.updateMenuItem);

// Xóa món
router.delete('/:id', menuController.deleteMenuItem);
export default router;