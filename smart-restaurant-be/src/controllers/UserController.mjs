import User from "../models/User.mjs";
import Restaurant from "../models/Restaurant.mjs"; // Import Restaurant
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from "cloudinary"; // Import để xóa ảnh cũ

const saltRounds = 10;

class UserController {
    // [GET] /api/user/account
    async getAccount(req, res, next) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) 
                return res.status(404).json({ message: "User not found"});

            let restaurant = null;

            // Nếu là Admin (Chủ quán) -> Tìm nhà hàng do họ sở hữu
            if (user.role === 'admin') {
                restaurant = await Restaurant.findOne({ adminId: user._id });
            } 
            // Nếu là Staff (Waiter/Kitchen) -> Tìm nhà hàng họ đang làm việc
            else if (user.restaurantId) {
                restaurant = await Restaurant.findById(user.restaurantId);
            }

            res.status(200).json({
                message: "Get account successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isLocked: user.isLocked,
                    avatar: user.avatar,
                    restaurantId: restaurant?._id || user.restaurantId, 
                    // Trả về object restaurant rút gọn để FE biết user này đã có quán chưa
                    restaurant: restaurant ? {
                        id: restaurant._id,
                        name: restaurant.name,
                        slug: restaurant.slug,
                        isActive: restaurant.isActive
                    } : null
                }
            })

        } catch(err) {
            res.status(500).json({ message: err.message });
        }
    }

    // [PATCH] /api/user/password
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            const user = await User.findById(userId);

            if (user.loginMethod !== 'local') {
                return res.status(400).json({ message: 'You are logged in via social media. Cannot change password.' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect.' });
            }

            const hashPassword = await bcrypt.hash(newPassword, saltRounds);
            user.password = hashPassword;
            await user.save();

            res.status(200).json({ message: 'Password changed successfully.' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    // [PATCH] /api/user/info
    async updateAccountInfo(req, res, next) {
        try {

            const { fullName } = req.body;
            const userId = req.user.id;

            if (fullName !== undefined && fullName.trim().length < 2) {
                return res.status(400).json({ message: "Display name must be at least 2 characters." });
            }

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            const updates = {};
            if (fullName) updates.fullName = fullName;

            // Xử lý Avatar
            if (req.file) {
                // Nếu user đã có avatar cũ -> Xóa trên Cloudinary
                if (user.avatar && user.avatar.publicId) {
                    await cloudinary.uploader.destroy(user.avatar.publicId);
                }
                // Cập nhật avatar mới
                updates.avatar = {
                    url: req.file.path,
                    publicId: req.file.filename
                };
            }

            // Update User
            const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

            const userResponse = {
                id: updatedUser._id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                role: updatedUser.role,
                isLocked: updatedUser.isLocked,
                restaurantId: updatedUser.restaurantId,
                avatar: updatedUser.avatar
            };

            res.status(200).json({ message: 'Account info updated successfully.', user: userResponse });
        } catch (err) {
            // Nếu lỗi và đã lỡ upload ảnh -> xóa ảnh vừa up
            if (req.file) await cloudinary.uploader.destroy(req.file.filename);
            res.status(500).json({ message: err.message });
        }
    }

    // [DELETE] /api/user/account
    async deleteAccount(req, res, next) {
        try {
            const userId = req.user.id;

            // Logic mới: Nếu là chủ nhà hàng, xóa nhà hàng (hoặc disable)
            // Tạm thời xóa user, các logic xóa cascade (xóa món, xóa bàn) nên xử lý ở model middleware hoặc để sau
            await Restaurant.deleteMany({ adminId: userId });
            
            await User.findByIdAndDelete(userId);

            res.json({ message: 'Account deleted successfully.' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

export default new UserController();