import { Router } from "express";
import categoryController from "../controllers/CategoryController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();

// Route Public cho khách (KHÔNG check auth)
router.get('/public/:restaurantId', categoryController.getPublicCategories);

router.use(authMiddleware);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.get('/trash', categoryController.getTrashCategories);
router.delete('/:id', categoryController.deleteCategory);
router.patch('/:id', categoryController.updateCategory);
router.patch('/:id/restore', categoryController.restoreCategory);
router.delete('/:id/force', categoryController.forceDeleteCategory);

export default router;