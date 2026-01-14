import OrderSession from "../models/OrderSession.mjs";
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
            // Lấy danh sách các nhà hàng và adminId của chúng
            const restaurants = await Restaurant.find().select('adminId');
            const ownerAdminIds = restaurants.map(r => r.adminId);

            // Chỉ lấy admin là owner (adminId có trong danh sách nhà hàng)
            const admins = await User.find({ 
                role: 'admin',
                $or: [
                    { _id: { $in: ownerAdminIds } },
                    { restaurantId: null },
                ],
            })
                .select('-password')
                .sort({ createdAt: -1 });

            // Lấy thêm thông tin nhà hàng của từng owner
            const adminWithRestaurant = await Promise.all(admins.map(async (admin) => {
                const restaurant = await Restaurant.findOne({ adminId: admin._id });
                return {
                    ...admin.toObject(),
                    restaurant: restaurant ? {
                        _id: restaurant._id,
                        name: restaurant.name,
                        slug: restaurant.slug,
                        isActive: restaurant.isActive
                    } : null
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
            const { filter } = req.query; // 'week', 'month', 'year'

            const totalRestaurants = await Restaurant.countDocuments();
            
            // Đếm số chủ nhà hàng (admin có restaurant)
            const restaurants = await Restaurant.find().select('adminId');
            const totalAdmins = restaurants.length; // Mỗi restaurant có 1 owner
            
            const totalUsers = await User.countDocuments(); // Tổng user toàn hệ thống

            // Tính tổng doanh thu từ tất cả các nhà hàng
            const revenueAgg = await Restaurant.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSystemRevenue: { $sum: "$totalRevenue" }
                    }
                }
            ]);
            const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalSystemRevenue : 0;

            // --- CHART LOGIC START (Copy from RestaurantController but global) ---
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let chartData = [];
            let matchStage = {
                paymentStatus: 'paid' // Chỉ tính đơn đã thanh toán
            };

            if (filter === 'year') {
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
                matchStage.updatedAt = { $gte: startOfYear, $lte: endOfYear };

                const stats = await OrderSession.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: { $month: "$updatedAt" }, // 1-12
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                chartData = months.map((name, index) => {
                    const found = stats.find(s => s._id === (index + 1));
                    return { name, value: found ? found.total : 0 };
                });

            } else if (filter === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                matchStage.updatedAt = { $gte: startOfMonth, $lte: endOfMonth };

                const stats = await OrderSession.aggregate([
                    { $match: matchStage },
                    {
                        $project: {
                            day: { $dayOfMonth: "$updatedAt" },
                            totalAmount: 1
                        }
                    },
                    {
                        $bucket: {
                            groupBy: "$day",
                            boundaries: [1, 8, 15, 22, 32],
                            default: "Other",
                            output: {
                                total: { $sum: "$totalAmount" }
                            }
                        }
                    }
                ]);
                
                const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                const bucketMap = { 1: 0, 8: 1, 15: 2, 22: 3 };
                
                chartData = weeks.map((name, index) => ({ name, value: 0 }));
                stats.forEach(s => {
                    const idx = bucketMap[s._id];
                    if (idx !== undefined) chartData[idx].value = s.total;
                });

            } else { // 'week' (default)
                const currentDay = today.getDay(); // 0-6
                const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - distanceToMonday);
                startOfWeek.setHours(0, 0, 0, 0);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                matchStage.updatedAt = { $gte: startOfWeek, $lte: endOfWeek };

                const stats = await OrderSession.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: { $dayOfWeek: "$updatedAt" }, 
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);

                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const dayMap = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

                chartData = days.map((name, index) => ({ name, value: 0 }));
                stats.forEach(s => {
                    const idx = dayMap[s._id];
                    if (idx !== undefined) chartData[idx].value = s.total;
                });
            }

            res.status(200).json({
                stats: {
                    totalRestaurants,
                    totalAdmins,
                    totalUsers,
                    revenue,
                    revenueChart: chartData 
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/super/admin/:id
    // Cập nhật thông tin Admin
    async updateRestaurantAdmin(req, res) {
        try {
            const { id } = req.params;
            const { email, fullName, password } = req.body;

            // 1. Check email duplicate (nếu đổi email, loại trừ chính user đang sửa)
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({ message: "Email already exists." });
            }

            const updateData = { email, fullName };

            // 2. Nếu có password mới thì hash và update, ngược lại giữ nguyên
            if (password && password.trim() !== "") {
                const hashPassword = await bcrypt.hash(password, saltRounds);
                updateData.password = hashPassword;
            }

            const updatedAdmin = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

            res.status(200).json({ message: "Admin updated successfully", admin: updatedAdmin });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

}

export default new SuperAdminController();