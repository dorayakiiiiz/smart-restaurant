// Kiểm tra JWT token, phân quyền

import jwt from "jsonwebtoken"
import User from "../models/User.mjs";

// Middleware xác thực người dùng đã đăng nhập
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "Missing token" });

    const token = authHeader.split(' ')[1];

    if (!token)
        return res.status(401).json({ message: 'Access token required.' });

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    
    try {
        const decoded = jwt.verify(token, accessTokenSecret);
        
        // Load user từ database để có đầy đủ thông tin (bao gồm restaurantId)
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        req.user = user;
        next();
        
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token"} );
    }
}

export default authMiddleware;