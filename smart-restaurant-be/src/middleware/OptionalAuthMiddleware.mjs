import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Nếu không có token, vẫn cho qua (Guest ordering)
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        req.user = user || null;
    } catch (err) {
        // Token lỗi hoặc hết hạn -> Coi như guest
        req.user = null;
    }
    
    next();
}

export default optionalAuthMiddleware;