import Category from "../models/Category.mjs";
import Restaurant from "../models/Restaurant.mjs";

class CategoryController {
    // [GET] /api/categories
    async getCategories(req, res) {
        try {
            // Tìm nhà hàng của user đang đăng nhập
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const categories = await Category.find({ restaurantId: restaurant._id }).sort({ order: 1 });
            res.status(200).json({ categories });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/categories
    async createCategory(req, res) {
        try {
            const { name } = req.body;
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
            
            const category = await Category.create({
                restaurantId: restaurant._id,
                name
            });
            res.status(201).json({ category });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/categories/:id
    async deleteCategory(req, res) {
        try {
            await Category.findByIdAndDelete(req.params.id);
            // TODO: Cần xử lý các món ăn thuộc category này (set null hoặc xóa)
            res.status(200).json({ message: "Category deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new CategoryController();