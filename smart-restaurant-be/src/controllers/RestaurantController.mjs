import Restaurant from "../models/Restaurant.mjs";
import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Table from "../models/Table.mjs";
import mongoose from "mongoose"; // Import mongoose
import { encrypt, decrypt } from "../utils/crypto.mjs";
class RestaurantController {
    // [POST] /api/restaurant
    //Chỉ có admin (chủ quán) mới được tạo nhà hàng
    async createRestaurant(req, res) {
        try {
            const { name, address, bio } = req.body;
            
            // Kiểm tra xem user đã có nhà hàng chưa (Single restaurant system)
            const existing = await Restaurant.findOne({ adminId: req.user.id });
            if (existing) return res.status(400).json({ message: "You already have a restaurant." });

            const data = {
                adminId: req.user.id,
                name,
                address,
                bio
            };

            // Xử lí upload hình ảnh nếu có
            if (req.files?.logo?.[0]) data.logoUrl = req.files.logo[0].path;
            if (req.files?.cover?.[0]) data.coverUrl = req.files.cover[0].path;

            const restaurant = await Restaurant.create(data);
            res.status(201).json({ message: "Restaurant created!", restaurant });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/restaurant/me
    async getMyRestaurant(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // Clone object để xử lý dữ liệu trả về
            const restaurantData = restaurant.toObject();

            // Giải mã thông tin PayOS để hiển thị lại trên form (nếu có)
            if (restaurantData.payosConfig && restaurantData.payosConfig.isConfigured) {
                restaurantData.payosConfig = {
                    clientId: decrypt(restaurant.payosConfig.clientId),
                    apiKey: decrypt(restaurant.payosConfig.apiKey),
                    checksumKey: decrypt(restaurant.payosConfig.checksumKey),
                    isConfigured: true
                };
            } else {
                // Trả về rỗng nếu chưa cấu hình
                restaurantData.payosConfig = {
                    clientId: "",
                    apiKey: "",
                    checksumKey: "",
                    isConfigured: false
                };
            }

            res.status(200).json({ restaurant: restaurantData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/restaurant
    async updateRestaurant(req, res) {
        try {
            const updates = req.body;
            if (req.files?.logo?.[0]) updates.logoUrl = req.files.logo[0].path;
            if (req.files?.cover?.[0]) updates.coverUrl = req.files.cover[0].path;

            // Xử lý cập nhật PayOS Config
            if (updates.payosClientId && updates.payosApiKey && updates.payosChecksumKey) {
                updates.payosConfig = {
                    clientId: encrypt(updates.payosClientId),
                    apiKey: encrypt(updates.payosApiKey),
                    checksumKey: encrypt(updates.payosChecksumKey),
                    isConfigured: true
                };
                
                // Xóa các field tạm để không lưu rác vào db (nếu schema strict: false)
                delete updates.payosClientId;
                delete updates.payosApiKey;
                delete updates.payosChecksumKey;
            }

            const restaurant = await Restaurant.findOneAndUpdate(
                { adminId: req.user.id },
                updates,
                { new: true }
            );
            
            // Trả về data đã giải mã để UI cập nhật
            const restaurantData = restaurant.toObject();
            if (restaurantData.payosConfig && restaurantData.payosConfig.isConfigured) {
                restaurantData.payosConfig = {
                    clientId: decrypt(restaurant.payosConfig.clientId),
                    apiKey: decrypt(restaurant.payosConfig.apiKey),
                    checksumKey: decrypt(restaurant.payosConfig.checksumKey),
                    isConfigured: true
                };
            }

            res.status(200).json({ message: "Updated successfully", restaurant: restaurantData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    //Controller thống kê cho dashboard admin
    // [GET] /api/restaurant/stats
    async getDashboardStats(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // 1. Today's Revenue (Doanh thu hôm nay - chỉ tính đơn đã thanh toán)
            const revenueStats = await OrderSession.aggregate([
                {
                    $match: {
                        restaurantId: restaurant._id,
                        paymentStatus: 'paid',
                        updatedAt: { $gte: today, $lt: tomorrow }
                    }
                },
                {
                    $group: {
                        _id: null, //Gom documents thành 1 bảng duy nhất (Giống như SQL mà k có GROUP BY)
                        totalRevenue: { $sum: "$totalAmount" } // Field mới
                    }
                }
            ]);
            const todayRevenue = revenueStats[0]?.totalRevenue || 0;

            // 2. Active Orders (Đơn đang phục vụ - chưa hoàn thành/hủy)
            const activeOrders = await Order.countDocuments({
                restaurantId: restaurant._id,
                status: { $in: ['pending', 'accepted', 'preparing', 'ready'] }
            });

            // 3. Total Orders (Tổng đơn tạo hôm nay)
            const totalOrders = await Order.countDocuments({
                restaurantId: restaurant._id,
                createdAt: { $gte: today, $lt: tomorrow }
            });

            // 4. Occupied Tables (Bàn đang có khách)
            const occupiedTables = await Table.countDocuments({
                restaurantId: restaurant._id,
                status: 'occupied'
            });
            const totalTables = await Table.countDocuments({
                restaurantId: restaurant._id,
                isActive: true
            });

            // 5. Top Selling Items (Tính toán dựa trên Order đã hoàn thành)
            // Lưu ý: Chỉ tính các món trong order có status là 'served' hoặc 'completed' (đã phục vụ xong)
            // Hoặc tính tất cả các món đã được order (tùy logic kinh doanh, ở đây tính món đã bán được)
            const topSellingItems = await Order.aggregate([
                {
                    $match: {
                        restaurantId: restaurant._id,
                        status: { $in: ['served'] } 
                    }
                },
                { $unwind: "$items" }, // Tách mảng items thành từng document riêng
                {
                    $group: {
                        _id: "$items.menuItemId", // Group theo ID món ăn
                        name: { $first: "$items.name" }, // Lấy tên (giả sử không đổi)
                        totalQuantity: { $sum: "$items.quantity" }, // Tổng số lượng bán
                        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } // Tổng tiền
                    }
                },
                { $sort: { totalQuantity: -1 } }, // Sắp xếp giảm dần theo số lượng
                { $limit: 5 }, // Lấy top 5
                {
                    $lookup: { // Join để lấy hình ảnh từ MenuItem gốc
                        from: "menuitems",
                        localField: "_id",
                        foreignField: "_id",
                        as: "menuItemDetails"
                    }
                },
                {
                    $project: {
                        name: 1,
                        totalQuantity: 1,
                        totalRevenue: 1,
                        image: { $arrayElemAt: ["$menuItemDetails.images.url", 0] } // Lấy ảnh đầu tiên
                    }
                }
            ]);

            // 6. Recent Orders (Lấy 5 đơn mới nhất)
            const recentOrders = await Order.find({ restaurantId: restaurant._id })
                .sort({ createdAt: -1 }) // Mới nhất trước
                .limit(5)
                .populate({
                    path: 'sessionId',
                    populate: { path: 'tableId', select: 'name' } // Lấy tên bàn
                })
                .select('items status createdAt sessionId totalAmount'); // Chỉ lấy các trường cần thiết

            res.status(200).json({
                revenue: todayRevenue,
                activeOrders,
                totalOrders,
                occupiedTables,
                totalTables,
                topSellingItems,
                recentOrders,
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new RestaurantController();