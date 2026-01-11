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
            if (!['admin', 'waiter', 'kitchen'].includes(role)) {
                return res.status(400).json({ message: "Invalid role. Must be 'admin', 'waiter' or 'kitchen'." });
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
                role,
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

    // [GET] /api/staff
    // Lấy danh sách nhân viên của nhà hàng (Admin quản lý)
    async getAllStaff(req, res) {
        try {
            const adminId = req.user.id;
            const userRestaurantId = req.user.restaurantId;

            // 1. Tìm nhà hàng (Hỗ trợ cả Owner và Manager lấy list)
            let restaurant = null;
            if (userRestaurantId) {
                restaurant = await Restaurant.findById(userRestaurantId);
            } else {
                restaurant = await Restaurant.findOne({ adminId });
            }
            
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found." });
            }

            // 2. Lấy tất cả staff thuộc nhà hàng này 
            const staff = await User.find({ 
                restaurantId: restaurant._id,
                id: { $ne: req.user.id },
                role: { $in: ['admin', 'waiter', 'kitchen'] }
            })
                .select('-password') // Không trả về password
                .sort({ createdAt: -1 });

            // 3. Thêm thông tin restaurant vào mỗi staff (để hiển thị cột Restaurant)
            const staffWithRestaurant = staff.map(s => ({
                ...s.toObject(),
                restaurant: {
                    _id: restaurant._id,
                    name: restaurant.name,
                    isActive: restaurant.isActive
                }
            }));

            res.status(200).json({ staff: staffWithRestaurant });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/staff/:id
    // Cập nhật thông tin Staff
    async updateStaff(req, res) {
        try {
            const { id } = req.params;
            const { email, fullName, role, password } = req.body;
            const adminId = req.user.id;

            // 1. Validate Role
            if (role && !['waiter', 'kitchen'].includes(role)) {
                return res.status(400).json({ message: "Invalid role. Must be 'waiter' or 'kitchen'." });
            }

            // 2. Tìm nhà hàng của Admin
            const restaurant = await Restaurant.findOne({ adminId });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found." });
            }

            // 3. Tìm staff
            const staff = await User.findOne({ 
                _id: id, 
                restaurantId: restaurant._id,
                role: { $in: ['waiter', 'kitchen'] }
            });

            if (!staff) {
                return res.status(404).json({ message: "Staff not found or unauthorized." });
            }

            // 4. Check email nếu thay đổi
            if (email && email !== staff.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "Email already exists." });
                }
                staff.email = email;
            }

            // 5. Update các field
            if (fullName) staff.fullName = fullName;
            if (role) staff.role = role;
            
            // 6. Update password nếu có
            if (password && password.trim() !== '') {
                const hashPassword = await bcrypt.hash(password, saltRounds);
                staff.password = hashPassword;
            }

            await staff.save();

            res.status(200).json({ 
                message: "Staff updated successfully.",
                staff: {
                    id: staff._id,
                    fullName: staff.fullName,
                    role: staff.role,
                    email: staff.email
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/staff/:id/lock
    // Khóa/Mở khóa tài khoản Staff
    async toggleLockStaff(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            // 1. Tìm nhà hàng của Admin
            const restaurant = await Restaurant.findOne({ adminId });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found." });
            }

            // 2. Tìm staff và kiểm tra có thuộc nhà hàng này không
            const staff = await User.findOne({ 
                _id: id, 
                restaurantId: restaurant._id,
                role: { $in: ['waiter', 'kitchen'] }
            });

            if (!staff) {
                return res.status(404).json({ message: "Staff not found or unauthorized." });
            }

            // 3. Toggle trạng thái lock
            staff.isLocked = !staff.isLocked;
            await staff.save();

            res.status(200).json({ 
                message: staff.isLocked ? "Staff account locked successfully." : "Staff account unlocked successfully.",
                isLocked: staff.isLocked 
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/staff/:id
    // Xóa tài khoản Staff
    async deleteStaff(req, res) {
        try {
            const { id } = req.params;
            const requestUserId = req.user.id;

            const targetUser = await User.findById(id);
            if (!targetUser) {
                return res.status(404).json({ message: "User not found." });
            }

            // Lấy thông tin nhà hàng để check quyền Owner
            const restaurant = await Restaurant.findById(targetUser.restaurantId);
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found." });
            }

            const isOwner = restaurant.adminId.toString() === requestUserId;

            // Nếu target là Admin (Manager), chỉ có Owner mới được xóa
            if (targetUser.role === 'admin' && !isOwner) {
                return res.status(403).json({ message: "Permission denied. Only the Restaurant Owner can delete Managers." });
            }

            // Không ai được xóa chính mình
            if (id === requestUserId) {
                return res.status(400).json({ message: "Cannot delete your own account." });
            }

            await User.findByIdAndDelete(id);

            res.status(200).json({ message: "Staff deleted successfully." });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new StaffController();