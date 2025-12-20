import Category from "../models/Category.mjs";
import Restaurant from "../models/Restaurant.mjs";
import MenuItem from "../models/MenuItem.mjs";

class CategoryController {
    // [GET] /api/categories
    async getCategories(req, res) {
        try {
            // Tìm nhà hàng của user đang đăng nhập (dùng adminId)
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // Lấy tất cả category thuộc nhà hàng này
            const categories = await Category.find({ restaurantId: restaurant._id }).sort({ order: 1 });
            res.status(200).json({ categories });
        } catch (err) {
            console.error("Get Categories Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/categories
    async createCategory(req, res) {
        try {
            const { name } = req.body;
            if (!name) return res.status(400).json({ message: "Category name is required" });

            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
            
            const category = await Category.create({
                restaurantId: restaurant._id,
                name
            });
            res.status(201).json({ message: "Category created", category });
        } catch (err) {
            console.error("Create Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/categories/:id
    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // Kiểm tra category có thuộc nhà hàng này không
            const category = await Category.findOne({ _id: id, restaurantId: restaurant._id });
            if (!category) return res.status(404).json({ message: "Category not found or unauthorized" });

            // Xóa category
            await Category.findByIdAndDelete(id);

            // Cập nhật các món ăn thuộc category này về null hoặc category mặc định (nếu có)
            // Ở đây ta set về null để tránh lỗi reference
            await MenuItem.updateMany({ categoryId: id }, { $unset: { categoryId: "" } });

            res.status(200).json({ message: "Category deleted" });
        } catch (err) {
            console.error("Delete Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/categories/:id
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) return res.status(400).json({ message: "Category name is required" });

            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // Kiểm tra quyền sở hữu và cập nhật
            const category = await Category.findOneAndUpdate(
                { _id: id, restaurantId: restaurant._id },
                { name },
                { new: true } // Trả về dữ liệu mới sau khi update
            );

            if (!category) {
                return res.status(404).json({ message: "Category not found or unauthorized" });
            }

            res.status(200).json({ message: "Category updated", category });
        } catch (err) {
            console.error("Update Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
}
export default new CategoryController();