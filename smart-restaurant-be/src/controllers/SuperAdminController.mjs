import User from "../models/User.mjs";
import Restaurant from "../models/Restaurant.mjs";
import bcrypt from 'bcrypt';

const saltRounds = 10;

// controller cho super admin quản lí nhà hàng
class SuperAdminController {
    
    // [GET] /api/super/admin
    // Lấy danh sách các chủ nhà hàng (Role: admin)
    async getAllRestaurantAdmins(req, res) {
        try {
            const admins = await User.find({ role: 'admin' })
                .select('-password')
                .sort({ createdAt: -1 });

            // Lấy thêm thông tin nhà hàng của từng owner (nếu có)
            const adminWithRestaurant = await Promise.all(admins.map(async (admin) => {
                const restaurant = await Restaurant.findOne({ adminId: admin._id }).select('name isActive');
                return {
                    ...admin.toObject(),
                    restaurant: restaurant || null
                };
            }));

            res.status(200).json({ admins: adminWithRestaurant });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/super/admin
    // Tạo tài khoản chủ nhà hàng mới
    async createRestaurantAdmin(req, res) {
        try {
            const { email, fullName, password } = req.body;

            // Validate
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already exists." });
            }

            const hashPassword = await bcrypt.hash(password, saltRounds);

            const newAdmin = await User.create({
                email,
                fullName,
                password: hashPassword,
                role: 'admin', 
                loginMethod: 'local'
            });

            res.status(201).json({ message: "Admin account created successfully", admin: newAdmin });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/super/admin/:id/lock
    // Khóa/Mở khóa tài khoản Admin
    async toggleRestaurantAdminLock(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) return res.status(404).json({ message: "User not found" });

            // Đảo ngược trạng thái
            user.isLocked = !user.isLocked;
            await user.save();

            res.status(200).json({ 
                message: user.isLocked ? "Account locked successfully." : "Account unlocked successfully.",
                isLocked: user.isLocked 
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/super/admin/:id
    // Xóa tài khoản Admin và Nhà hàng của họ
    async deleteRestaurantAdmin(req, res) {
        try {
            const { id } = req.params;

            // 1. Xóa nhà hàng thuộc về admin này (Cascade delete)
            await Restaurant.deleteMany({ adminId: id });

            // TODO: xóa các thứ liên quan tới nhà hàng đó

            // 2. Xóa user admin
            await User.findByIdAndDelete(id);

            res.status(200).json({ message: "Admin account and associated restaurant deleted." });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }


    // [GET] /api/super/admin/stats
    // API lấy số liệu thống kê cho Dashboard
    async getSystemStats(req, res) {
        try {
            const totalRestaurants = await Restaurant.countDocuments();
            const totalAdmins = await User.countDocuments({ role: 'admin' });
            const totalUsers = await User.countDocuments(); // Tổng user toàn hệ thống

            res.status(200).json({
                stats: {
                    totalRestaurants,
                    totalAdmins,
                    totalUsers,
                    revenue: 0 // Fake số liệu doanh thu hệ thống nếu chưa có logic tính tiền
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

}

export default new SuperAdminController();