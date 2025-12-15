import User from "../models/User.mjs";
import Restaurant from "../models/Restaurant.mjs";
import bcrypt from 'bcrypt';

const saltRounds = 10;

class StaffController {

    // [POST] /api/staff
    // Admin tạo tài khoản cho nhân viên (Waiter/Kitchen)
    async createStaff(req, res) {
        try {
            const { email, fullName, password, role } = req.body;
            const adminId = req.user.id;

            // 1. Validate Role (Chỉ được tạo waiter hoặc kitchen)
            if (!['waiter', 'kitchen'].includes(role)) {
                return res.status(400).json({ message: "Invalid role. Must be 'waiter' or 'kitchen'." });
            }

            // 2. Tìm nhà hàng của Admin này
            const restaurant = await Restaurant.findOne({ adminId });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found. You must setup restaurant first." });
            }

            // 3. Check email tồn tại
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already exists." });
            }

            // 4. Tạo User Staff
            const hashPassword = await bcrypt.hash(password, saltRounds);
            
            const newStaff = await User.create({
                email,
                fullName,
                password: hashPassword,
                role, // 'waiter' hoặc 'kitchen'
                restaurantId: restaurant._id, // Gán nhân viên vào nhà hàng này
                loginMethod: 'local'
            });

            res.status(201).json({ 
                message: "Staff account created successfully!", 
                staff: {
                    id: newStaff._id,
                    fullName: newStaff.fullName,
                    role: newStaff.role,
                    email: newStaff.email
                }
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new StaffController();