import Restaurant from "../models/Restaurant.mjs";
import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Table from "../models/Table.mjs";
import mongoose from "mongoose"; // Import mongoose
import User from "../models/User.mjs";
import { encrypt, decrypt } from "../utils/crypto.mjs";
import { PayOS } from "@payos/node"; // Import PayOS để check key

class RestaurantController {
    // [POST] /api/restaurant
    // Chỉ có admin (chủ quán) mới được tạo nhà hàng
    async createRestaurant(req, res) {
        try {
            const { name, address, bio, currency, contactPhone, contactEmail } = req.body;
            
            // Kiểm tra xem user đã có nhà hàng chưa (Single restaurant system)
            const existing = await Restaurant.findOne({ adminId: req.user.id });
            if (existing) return res.status(400).json({ message: "You already have a restaurant." });

            const data = {
                adminId: req.user.id,
                name,
                address,
                bio,
                currency,
                contact: {
                    phone: contactPhone || "",
                    email: contactEmail || ""
                }
            };

            // Xử lí upload hình ảnh nếu có
            if (req.files?.logo?.[0]) data.logoUrl = req.files.logo[0].path;
            if (req.files?.cover?.[0]) data.coverUrl = req.files.cover[0].path;

            const restaurant = await Restaurant.create(data);

            await User.findByIdAndUpdate(req.user.id, { restaurantId: restaurant._id });

            res.status(201).json({ message: "Restaurant created!", restaurant });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/restaurant/me
    async getMyRestaurant(req, res) {
        try {
            const restaurant = await Restaurant.findById(req.user.restaurantId);
            
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const isOwner = restaurant.adminId.toString() === req.user.id;

            // Clone object để xử lý dữ liệu trả về
            const restaurantData = restaurant.toObject();
            restaurantData.isOwner = isOwner;

            // Giải mã thông tin PayOS để hiển thị lại trên form (nếu có)
            if (restaurantData.payosConfig && restaurantData.payosConfig.isConfigured) {
                restaurantData.payosConfig = {
                    clientId: decrypt(restaurant.payosConfig.clientId),
                    apiKey: decrypt(restaurant.payosConfig.apiKey),
                    checksumKey: decrypt(restaurant.payosConfig.checksumKey),
                    isConfigured: true,
                    accountHolder: restaurant.payosConfig.accountHolder
                };
            } else {
                // Trả về rỗng nếu chưa cấu hình
                restaurantData.payosConfig = {
                    clientId: "",
                    apiKey: "",
                    checksumKey: "",
                    isConfigured: false,
                    accountHolder: ""
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

            // Xử lý contact
            if (updates.contactPhone !== undefined || updates.contactEmail !== undefined) {
                updates.contact = {
                    phone: updates.contactPhone || "",
                    email: updates.contactEmail || ""
                };
                delete updates.contactPhone;
                delete updates.contactEmail;
            }

            let accountHolder = '';

            // --- KIỂM TRA VÀ CẬP NHẬT PAYOS CONFIG ---
            if (updates.payosClientId && updates.payosApiKey && updates.payosChecksumKey) {
                
                // 1. Thử khởi tạo PayOS với key người dùng gửi lên
                try {
                    const tempPayOS = new PayOS({
                        clientId: updates.payosClientId,
                        apiKey: updates.payosApiKey,
                        checksumKey: updates.payosChecksumKey
                    });


                    // 2. Gọi thử API tạo link thanh toán giả để verify credentials
                    // Dùng timestamp làm orderCode để tránh trùng lặp
                    const testOrderCode = Number(String(Date.now()).slice(-9));
                    
                    const response = await tempPayOS.paymentRequests.create({
                        orderCode: testOrderCode,
                        amount: 2000, // Mức tối thiểu của PayOS
                        description: "Verify Key",
                        cancelUrl: "https://google.com", // Dummy URL
                        returnUrl: "https://google.com"  // Dummy URL
                    });

                    accountHolder = response.accountName;

                    // 3. Nếu không lỗi -> Key hợp lệ -> Tiến hành mã hóa và lưu
                    updates.payosConfig = {
                        clientId: encrypt(updates.payosClientId),
                        apiKey: encrypt(updates.payosApiKey),
                        checksumKey: encrypt(updates.payosChecksumKey),
                        isConfigured: true,
                        accountHolder: accountHolder
                    };
                    

                } catch (payosError) {
                    console.error("❌ PayOS Key Verification Failed:", payosError.message);
                    // Trả về lỗi 400 để Frontend hiển thị
                    return res.status(400).json({ 
                        message: "Invalid PayOS Credentials. Please check Client ID, API Key & Checksum Key.",
                        detail: payosError.message
                    });
                }

                // Xóa các field raw để không lưu vào root của document (nếu schema strict: false)
                delete updates.payosClientId;
                delete updates.payosApiKey;
                delete updates.payosChecksumKey;
            }

            const userRestaurantId = req.user.restaurantId;

            const restaurant = await Restaurant.findByIdAndUpdate(
                userRestaurantId,
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
                    isConfigured: true,
                    accountHolder: accountHolder
                };
            }

            res.status(200).json({ message: "Updated successfully", restaurant: restaurantData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    //Controller thống kê cho dashboard admin
    // [GET] /api/restaurant/stats/:filter
    async getDashboardStats(req, res) {
        try {

            // Chart filter
            const { filter } = req.query; // 'week', 'month', 'year'

            let restaurant = await Restaurant.findById(req.user.restaurantId);
            if (!restaurant) {
                restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);


            // --- CHART LOGIC START ---
            let chartData = [];
            let matchStage = {
                restaurantId: restaurant._id,
                paymentStatus: 'paid'
            };

            if (filter === 'year') {
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
                matchStage.updatedAt = { $gte: startOfYear, $lte: endOfYear };

                const stats = await OrderSession.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            //Group theo các session theo tháng và tính tổng doanh thu
                            _id: { $month: "$updatedAt" }, // 1-12
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                chartData = months.map((name, index) => {
                    const found = stats.find(s => s._id === (index + 1)); //Vì tháng lúc này có id từ 1-12
                    return { name, value: found ? found.total : 0 };
                });

            } else if (filter === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                matchStage.updatedAt = { $gte: startOfMonth, $lte: endOfMonth };

                const stats = await OrderSession.aggregate([
                    { $match: matchStage },
                    //Lấy ngày trong tháng
                    {
                        $project: {
                            day: { $dayOfMonth: "$updatedAt" },
                            totalAmount: 1
                        }
                    },
                    {
                        $bucket: {
                            groupBy: "$day",
                            boundaries: [1, 8, 15, 22, 32], // 1-7, 8-14, 15-21, 22-end
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
                    if (idx !== undefined) {
                        chartData[idx].value = s.total;
                    }
                });

            } else { // 'week' (default)
                const currentDay = today.getDay(); // 0-6 (Sun-Sat)
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
                            _id: { $dayOfWeek: "$updatedAt" }, // 1 (Sun) - 7 (Sat)
                            total: { $sum: "$totalAmount" }
                        }
                    }
                ]);

                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const dayMap = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

                chartData = days.map((name, index) => ({ name, value: 0 }));
                stats.forEach(s => {
                    const idx = dayMap[s._id];
                    if (idx !== undefined) {
                        chartData[idx].value = s.total;
                    }
                });
            }

            // --- CHART LOGIC END ---
            //Kết quả cuối cùng của chartData
            // chartData = [
            //     { name: 'Mon', value: 1200 },
            //     { name: 'Tue', value: 800 },
            //     ...
            //     ]

            // 1. Daily Revenue (Tính toán dựa trên OrderSession đã thanh toán hôm nay)
            const dailyRevenueResult = await OrderSession.aggregate([
                {
                    $match: {
                        restaurantId: restaurant._id,
                        paymentStatus: 'paid',
                        updatedAt: { $gte: today, $lt: tomorrow }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" }
                    }
                }
            ]);
            console.log(dailyRevenueResult);
            const dailyRevenue = dailyRevenueResult.length > 0 ? dailyRevenueResult[0].total : 0;

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
                { $sort: { totalQuantity: -1, totalRevenue: -1} }, // Sắp xếp giảm dần theo số lượng
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
                        image: { $arrayElemAt: [{ $ifNull: [{ $arrayElemAt: ["$menuItemDetails.images.url", 0] }, []] }, 0] } // Lấy ảnh đầu tiên
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
                revenue: dailyRevenue,
                activeOrders,
                totalOrders,
                occupiedTables,
                totalTables,
                topSellingItems,
                recentOrders,
                revenueChart: chartData,
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/restaurant/public/:id
    async getPublicRestaurant(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findById(id).select('-payosConfig -adminId');
            
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // ✅ TÍNH TOÁN SỐ ORDER THẬT
            // Đếm tất cả đơn hàng có status không phải là 'pending' (đã gửi bếp) hoặc 'cancelled'
            const totalOrders = await Order.countDocuments({ 
                restaurantId: id,
                status: { $nin: ['pending', 'cancelled'] } 
            });

            // Convert sang object để thêm field totalOrders vào response
            const restaurantData = restaurant.toObject();
            restaurantData.totalOrders = totalOrders;

            res.status(200).json({ restaurant: restaurantData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new RestaurantController();