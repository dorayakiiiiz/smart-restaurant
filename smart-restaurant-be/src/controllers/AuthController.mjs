
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
    // TODO: xử lí validate data ng dùng gửi lên
    async register(req, res, next) {
        try {

            const { email, fullName, password } = req.body;
            const user = await User.findOne({ email });
            if (user) 
                return res.status(400).json({ message: 'User existed.'});
            
            const hashPassword = await bcrypt.hash(password, saltRounds);
            
            const newUser = await User.create({
                email,
                fullName,
                password: hashPassword
            });

            res.json({ message: 'Register successfully!', userId: newUser._id });
            
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /auth/system/register -> của nhà hàng đki acc cho kds/staff...
    // TODO: xử lí validate data ng dùng gửi lên
    async registerSystem(req, res, next) {
        try {

            const { email, displayName, password } = req.body;
            
            const user = await User.findOne({ email });
            if (user) 
                return res.status(400).json({ message: 'User existed.'});
            
            const hashPassword = await bcrypt.hash(password, saltRounds);
            
            const newUser = await User.create({
                email,
                displayName,
                password: hashPassword
            });

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
                return res.status(403).json({ message: 'Your account has been locked due to violation.'})

            const match = await bcrypt.compare(password, user.password);
            if (!match) 
                return res.status(400).json({ message: 'Incorrect password.' });

            const token = jwt.sign(
                { 
                    id: user._id
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                message: 'Login successfully!',
                token
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
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
                'Linkify - Reset your password',
                `Hi,

We received a request to reset your Linkify password.

Your verification code is:
${otp}

This code will expire in 5 minutes.

If you didn't request this, you can safely ignore this email.

Linkify Team`
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

    // [GET] auth/google/redirect (hoặc /auth/google/callback)
    async google(req, res, next) {
        try { 
            const userInfo = req.user; 
            console.log(userInfo)
            
            if (!userInfo) {
                console.log('Lỗi không có userInfo')
                // Nếu có lỗi, chuyển hướng về trang đăng nhập của FE
                return res.send(generateAuthScript('login_failed', { message: 'User info not found' }));
            }

            if (userInfo.isLocked)
                return res.send(generateAuthScript('login_failed', { message: 'Your account has been locked due to violation.' }))

            // 2. Tạo JWT (dùng ID hoặc _id của Mongoose)
            const token = jwt.sign(
                { id: userInfo._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            // 3. Đặt JWT vào HTTP-only Cookie

            // res.cookie('jwt', token, {
            //     httpOnly: true, // Rất quan trọng: không thể truy cập từ JavaScript client-side
            //     secure: process.env.NODE_ENV === 'production', // Dùng HTTPS trong production
            //     maxAge: 7 * 24 * 60 * 60 * 1000 // Hết hạn sau 7 ngày
            // });

            console.log('[THÀNH CÔNG!!!]')
            return res.send(generateAuthScript('login_success', { token })); 
            
        } catch (err) {
            console.log("Google Auth Callback Error:", err);
            // Chuyển hướng về trang báo lỗi của Front-end
            return res.send(generateAuthScript('login_failed', { message: 'Authentication failed' }));
        }
    }
}

export default new AuthController();