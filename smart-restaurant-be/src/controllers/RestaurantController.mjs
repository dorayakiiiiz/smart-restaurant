import Restaurant from "../models/Restaurant.mjs";
import User from "../models/User.mjs";
import Order from "../models/Order.mjs"; // ✅ Thêm import Order
import { encrypt, decrypt } from "../utils/crypto.mjs";
import { PayOS } from "@payos/node"; // Import PayOS để check key

class RestaurantController {
    // [POST] /api/restaurant
    //Chỉ có admin (chủ quán) mới được tạo nhà hàng
    async createRestaurant(req, res) {
        try {
            const { name, address, bio, contactPhone, contactEmail } = req.body;
            
            // Kiểm tra xem user đã có nhà hàng chưa (Single restaurant system)
            const existing = await Restaurant.findOne({ adminId: req.user.id });
            if (existing) return res.status(400).json({ message: "You already have a restaurant." });

            const data = {
                adminId: req.user.id,
                name,
                address,
                bio,
                contact: {
                    phone: contactPhone || "",
                    email: contactEmail || ""
                }
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
                    isConfigured: true,
                    accountHolder: accountHolder
                };
            }

            res.status(200).json({ message: "Updated successfully", restaurant: restaurantData });
        } catch (err) {
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