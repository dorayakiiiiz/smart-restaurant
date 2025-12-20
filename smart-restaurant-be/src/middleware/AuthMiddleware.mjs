// Kiểm tra JWT token, phân quyền

import jwt from "jsonwebtoken"

// Để xác nhận người dùng đã đăng nhập
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "Missing token" });

    const token = authHeader.split(' ')[1];

    if (!token)
        return res.status(401).json({ message: 'Access token required.' });

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    
    try {
        const decoded = jwt.verify(token, accessTokenSecret);
        req.user = decoded;
        next();
        
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token"} );
    }
}

export default authMiddleware;