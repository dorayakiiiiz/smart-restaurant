import { Router } from "express";
import tableController from "../controllers/TableController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

router.get('/', tableController.getTables);
router.post('/', tableController.createTable);
router.delete('/:id', tableController.deleteTable);

export default router;