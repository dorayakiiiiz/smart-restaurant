import { Router } from "express";
import { uploadRestaurant } from "../config/cloudinary.mjs";
import restaurantController from "../controllers/RestaurantController.mjs";
import authMiddleware from "../middleware/AuthMiddleware.mjs";

const router = Router();
router.use(authMiddleware);

router.get('/me', restaurantController.getMyRestaurant);
router.post('/', uploadRestaurant.fields([{ name: 'logo' }, { name: 'cover' }]), restaurantController.createRestaurant);
router.patch('/', uploadRestaurant.fields([{ name: 'logo' }, { name: 'cover' }]), restaurantController.updateRestaurant);

export default router;