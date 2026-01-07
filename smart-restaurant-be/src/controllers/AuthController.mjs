import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import User from "../models/User.mjs";
import Otp from '../models/Otp.mjs';
import sendEmail from '../utils/sendEmail.mjs';

const saltRounds = 10;

const generateAuthScript = (type, data) => {
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

    return `
        <script>
            const authData = { 
                type: '${type}', 
                payload: ${JSON.stringify(data)} 
            };
            window.opener.postMessage(authData, '${clientURL}'); 
            window.close();
        </script>
    `;
};

class AuthController {
    // [POST] /auth/register -> của customer
    // async register(req, res, next) {
    //     try {
    //         // Nhận thêm restaurantId từ Frontend gửi lên
    //         const { email, fullName, password, restaurantId } = req.body;

    //         // Tìm user có email này TRONG NHÀ HÀNG NÀY
    //         const user = await User.findOne({ email, restaurantId });
            
    //         if (user) {
    //             return res.status(400).json({ message: 'Email already exists in this restaurant.' });
    //         }

    //         const hashPassword = await bcrypt.hash(password, saltRounds);
            
    //         const newUser = await User.create({
    //             email,
    //             fullName,
    //             password: hashPassword,
    //             restaurantId: restaurantId // Lưu khóa ngoại
    //         });

    //         res.json({ message: 'Register successfully!', userId: newUser._id });
            
    //     } catch (err) {
    //         res.status(500).json({ error: err.message });
    //     }
    // }

    // [POST] /auth/register-otp
    // Step 1: Validate info, check duplicate, send OTP
    async sendRegisterOtp(req, res, next) {
        try {
            const { email, fullName, password, restaurantId } = req.body;

            if (!email || !fullName || !password) {
                return res.status(400).json({ message: "Please fill in all fields." });
            }

            // Check if user exists in this restaurant
            const user = await User.findOne({ email, restaurantId });
            if (user) {
                return res.status(400).json({ message: "Email already exists in this restaurant." });
            }

            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Save OTP to DB (Upsert: update if exists, insert if new)
            await Otp.findOneAndUpdate(
                { email },
                { otp, createdAt: Date.now() },
                { upsert: true, new: true }
            );

            // Send Email
            await sendEmail(email, "Smart Restaurant - Verify your account", `Your OTP code is: ${otp}. It expires in 5 minutes.`);

            res.json({ message: "OTP sent to your email." });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /auth/register-verify
    // Step 2: Verify OTP and Create User
    async verifyRegisterAndCreate(req, res, next) {
        try {
            const { email, otp, fullName, password, restaurantId } = req.body;

            // Find OTP
            const otpRecord = await Otp.findOne({ email });
            if (!otpRecord) {
                return res.status(400).json({ message: "OTP expired or not found. Please try again." });
            }

            if (otpRecord.otp !== otp) {
                return res.status(400).json({ message: "Invalid OTP." });
            }

            // OTP Valid -> Create User
            const hashPassword = await bcrypt.hash(password, saltRounds);
            
            const newUser = await User.create({
                email,
                fullName,
                password: hashPassword,
                restaurantId: restaurantId
            });

            // Delete OTP after usage
            await Otp.deleteOne({ email });

            res.json({ message: 'Register successfully!', userId: newUser._id });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /auth/login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user)
                return res.status(404).json({ message: 'Email does not exist.'});

            if (user.isLocked)
                return res.status(403).json({ message: 'Your account has been locked.'})

            const match = await bcrypt.compare(password, user.password);
            if (!match) 
                return res.status(400).json({ message: 'Incorrect password.' });

            const access_token_secret = process.env.ACCESS_TOKEN_SECRET;
            const refresh_token_secret = process.env.REFRESH_TOKEN_SECRET;

            const accessToken = jwt.sign({ id: user._id }, access_token_secret, { expiresIn: '15m' }); // Short life
            const refreshToken = jwt.sign({ id: user._id }, refresh_token_secret, { expiresIn: '7d' }); // Long life


            res.json({
                message: 'Login successfully!',
                accessToken,
                refreshToken
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /auth/refresh-token
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken)
                return res.status(401).json({ message: 'No refresh token provided.' });

            const access_token_secret = process.env.ACCESS_TOKEN_SECRET;
            const refresh_token_secret = process.env.REFRESH_TOKEN_SECRET;

            const decoded = jwt.verify(refreshToken, refresh_token_secret);

            const newAccessToken = jwt.sign(
                { id: decoded.id },
                access_token_secret,
                { expiresIn: '15m' }
            );

            res.json({ accessToken: newAccessToken });

        } catch (err) {
            res.status(403).json({ error: err.message });
        }
    }
    
    // [POST] /auth/forgot-password
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) 
                return res.status(404).json({ message: 'Email does not exits' });

            if (user.loginMethod !== 'local')
                return res.status(400).json({ message: 'This account uses social login (Google/FB).' });

            //Tạo chuỗi OTP ngẫu nhiên 6 chữ số
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            //Xóa mã OTP cũ (nếu có)
            await Otp.deleteMany({ email });
            //Lưu mã OTP mới vào DB
            await Otp.create({ email, otp });

            await sendEmail(
                user.email, 
                'SmartRestaurant - Reset your password',
                `Hi,

We received a request to reset your SmartRestaurant password.

Your verification code is:
${otp}

This code will expire in 5 minutes.

If you didn't request this, you can safely ignore this email.

SmartRestaurant Team`
            );


            res.status(200).json({ message: 'OTP sent to your email.' });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /auth/reset-password
    async resetPassword(req, res, next) {
        try {

            const { email, otp, newPassword } = req.body;

            const otpRecord = await Otp.findOne({ email, otp });
            if (!otpRecord)
                return res.status(400).json({ message: 'Invalid or expired OTP.' });

            const hashPassword = await bcrypt.hash(newPassword, saltRounds);

            await User.findOneAndUpdate(
                { email },
                { password: hashPassword }
            );

            await Otp.deleteMany({ email });

            res.status(200).json({ message: 'Password reset successfully.' });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] auth/google/redirect
    async google(req, res, next) {
        try { 
            const userInfo = req.user; 
            
            if (!userInfo) {
                return res.send(generateAuthScript('login_failed', { message: 'User info not found' }));
            }

            if (userInfo.isLocked) {
                return res.send(generateAuthScript('login_failed', { message: 'Your account has been locked.' }));
            }

            // --- SỬA ĐOẠN NÀY ---
            // Tạo cả 2 loại token giống hệt logic hàm login()
            const access_token_secret = process.env.ACCESS_TOKEN_SECRET;
            const refresh_token_secret = process.env.REFRESH_TOKEN_SECRET;

            const accessToken = jwt.sign({ id: userInfo._id }, access_token_secret, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ id: userInfo._id }, refresh_token_secret, { expiresIn: '7d' });

            // Trả về payload có đủ accessToken và refreshToken
            return res.send(generateAuthScript('login_success', { 
                accessToken, 
                refreshToken 
            })); 
            
        } catch (err) {
            console.log("Google Auth Callback Error:", err);
            return res.send(generateAuthScript('login_failed', { message: 'Authentication failed' }));
        }
    }
}

export default new AuthController();