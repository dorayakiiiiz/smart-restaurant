import MenuItem from "../models/MenuItem.mjs";
import Restaurant from "../models/Restaurant.mjs";
import Category from "../models/Category.mjs";

class MenuController {
    // [GET] /api/menu
    async getMenu(req, res) {
        try {
            // Tìm nhà hàng dựa trên adminId (người dùng đang đăng nhập)
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            // Lấy tất cả món ăn thuộc nhà hàng này, kèm thông tin category
            const items = await MenuItem.find({ restaurantId: restaurant._id })
                .populate('categoryId', 'name') // Chỉ lấy tên category
                .sort({ createdAt: -1 }); // Mới nhất lên đầu

            res.status(200).json({ items });
        } catch (err) {
            console.error("Get Menu Error:", err);
            res.status(500).json({ message: "Internal Server Error", error: err.message });
        }
    }

    // [POST] /api/menu
    async createMenuItem(req, res) {
        try {
            const { name, price, description, categoryId, prepTime, modifiers, isAvailable, isSoldOut } = req.body;
            
            // 1. Validate input cơ bản
            if (!name || !price || !categoryId) {
                return res.status(400).json({ message: "Name, price, and category are required" });
            }

            // 2. Tìm nhà hàng
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found. Please set up your restaurant first." });
            }

            // 3. Kiểm tra Category có thuộc nhà hàng này không
            const category = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id });
            if (!category) {
                return res.status(400).json({ message: "Invalid category for this restaurant" });
            }

            // 4. Chuẩn bị dữ liệu
            const data = {
                restaurantId: restaurant._id,
                categoryId,
                name,
                price: Number(price),
                description,
                prepTime: prepTime ? Number(prepTime) : 15,
                // Parse boolean từ string (do FormData gửi string)
                isAvailable: isAvailable === 'true' || isAvailable === true,
                isSoldOut: isSoldOut === 'true' || isSoldOut === true,
                modifiers: modifiers ? JSON.parse(modifiers) : []
            };

            // 5. Xử lý hình ảnh nếu có
            if (req.file) {
                data.imageUrl = req.file.path;
            }

            const newItem = await MenuItem.create(data);
            
            // Populate category để trả về frontend hiển thị ngay
            await newItem.populate('categoryId', 'name');

            res.status(201).json({ message: "Item created successfully", item: newItem });
        } catch (err) {
            console.error("Create Menu Item Error:", err);
            res.status(500).json({ message: "Failed to create menu item", error: err.message });
        }
    }

    // [PATCH] /api/menu/:id
    async updateMenuItem(req, res) {
        try {
            const { id } = req.params;
            const updates = { ...req.body };
            console.log("Update Data:", updates);
            
            // 1. Tìm nhà hàng để đảm bảo quyền sở hữu
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // 2. Kiểm tra món ăn có tồn tại và thuộc nhà hàng này không
            const item = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id });
            if (!item) return res.status(404).json({ message: "Menu item not found" });

            // 3. Xử lý dữ liệu update
            if (req.file) updates.imageUrl = req.file.path;
            if (updates.modifiers) updates.modifiers = JSON.parse(updates.modifiers);
            if (updates.price) updates.price = Number(updates.price);
            if (updates.prepTime) updates.prepTime = Number(updates.prepTime);
            // Parse boolean cho update
            if (updates.isAvailable !== undefined) {
                updates.isAvailable = updates.isAvailable === 'true' || updates.isAvailable === true;
            }
            if (updates.isSoldOut !== undefined) {
                updates.isSoldOut = updates.isSoldOut === 'true' || updates.isSoldOut === true;
            }
            
            // Xử lý category nếu có thay đổi
            if (updates.categoryId) {
                const category = await Category.findOne({ _id: updates.categoryId, restaurantId: restaurant._id });
                if (!category) return res.status(400).json({ message: "Invalid category" });
            }

            //Update món ăn
            const updatedItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true })
                .populate('categoryId', 'name'); // Populate lại category chỉ trả về name

            res.status(200).json({ message: "Item updated successfully", item: updatedItem });
        } catch (err) {
            console.error("Update Menu Item Error:", err);
            res.status(500).json({ message: "Failed to update menu item", error: err.message });
        }
    }

    // [DELETE] /api/menu/:id
    async deleteMenuItem(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const deletedItem = await MenuItem.findOneAndDelete({ _id: id, restaurantId: restaurant._id });
            
            if (!deletedItem) {
                return res.status(404).json({ message: "Item not found or unauthorized" });
            }

            res.status(200).json({ message: "Item deleted successfully" });
        } catch (err) {
            console.error("Delete Menu Item Error:", err);
            res.status(500).json({ message: "Failed to delete item", error: err.message });
        }
    }
}

export default new MenuController();