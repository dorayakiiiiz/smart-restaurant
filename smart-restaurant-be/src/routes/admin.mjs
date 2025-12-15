import { Router } from "express";
import authMiddleware from "../middleware/AuthMiddleware.mjs";
import adminController from "../controllers/AdminController.mjs";

const router = Router();

router.use(authMiddleware);

export default router;