import { Router } from "express";
import { uploadMenu } from "../config/cloudinary.mjs";
import menuController from "../controllers/MenuController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

router.get('/', menuController.getMenu);
router.post('/', uploadMenu.single('image'), menuController.createMenuItem);
router.patch('/:id', uploadMenu.single('image'), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

export default router;