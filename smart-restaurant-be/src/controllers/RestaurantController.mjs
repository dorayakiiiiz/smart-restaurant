import Restaurant from "../models/Restaurant.mjs";

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
            res.status(200).json({ restaurant });
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

            const restaurant = await Restaurant.findOneAndUpdate(
                { adminId: req.user.id },
                updates,
                { new: true }
            );
            res.status(200).json({ message: "Updated successfully", restaurant });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new RestaurantController();