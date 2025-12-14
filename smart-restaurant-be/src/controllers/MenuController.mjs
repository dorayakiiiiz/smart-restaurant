import MenuItem from "../models/MenuItem.mjs";
import Restaurant from "../models/Restaurant.mjs";

class MenuController {
    // [GET] /api/menu (Lấy toàn bộ menu của quán)
    async getMenu(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const items = await MenuItem.find({ restaurantId: restaurant._id })
                .populate('categoryId')
                .sort({ order: 1 });
            res.status(200).json({ items });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/menu
    async createMenuItem(req, res) {
        try {
            const { name, price, description, categoryId, prepTime, modifiers } = req.body;
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

            const data = {
                restaurantId: restaurant._id,
                categoryId,
                name,
                price,
                description,
                prepTime,
                modifiers: modifiers ? JSON.parse(modifiers) : []
            };

            if (req.file) data.imageUrl = req.file.path;

            const newItem = await MenuItem.create(data);
            res.status(201).json({ message: "Item created", item: newItem });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/menu/:id
    async updateMenuItem(req, res) {
        try {
            const updates = req.body;
            if (req.file) updates.imageUrl = req.file.path;
            if (updates.modifiers) updates.modifiers = JSON.parse(updates.modifiers);

            const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
            res.status(200).json({ message: "Item updated", item });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/menu/:id
    async deleteMenuItem(req, res) {
        try {
            await MenuItem.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Item deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new MenuController();