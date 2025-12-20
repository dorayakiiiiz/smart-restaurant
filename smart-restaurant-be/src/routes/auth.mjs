import { Router } from "express";
import passport from "passport";
import '../strategies/google-strategy.mjs'
import authController from "../controllers/AuthController.mjs";

const router = Router();

// Auth bằng pass
router.post('/login', authController.login);
router.post('/register', authController.register); // customer register
router.post('/refresh-token', authController.refreshToken);

// reset password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Auth bằng google
router.get('/google', 
    passport.authenticate('google', { 
        session: false // Tắt session để dùng JWT
    })
);
router.get('/google/redirect', 
    passport.authenticate('google', { session: false }),
    authController.google
);


export default router;