import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// config up ảnh lên cloudinary

const restaurantStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "smart-restaurant/branding",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `restaurant_${req.user.id}_${Date.now()}`,
  },
});

const menuStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "smart-restaurant/menu-items",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `menu_${Date.now()}`,
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "smart-restaurant/avatars",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `avatar_${req.user.id}_${Date.now()}`,
  },
});

export const uploadRestaurant = multer({ storage: restaurantStorage });
export const uploadMenu = multer({ storage: menuStorage });
export const uploadAvatar = multer({ storage: avatarStorage }); // Export middleware mới