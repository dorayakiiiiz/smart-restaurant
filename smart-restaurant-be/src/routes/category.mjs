import { Router } from "express";
import categoryController from "../controllers/CategoryController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;