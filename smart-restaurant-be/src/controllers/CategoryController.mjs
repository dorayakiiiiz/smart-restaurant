import Category from "../models/Category.mjs";
import Restaurant from "../models/Restaurant.mjs";
import MenuItem from "../models/MenuItem.mjs";
import mongoose from "mongoose"; // Cần import mongoose

class CategoryController {
    // [GET] /api/categories
    async getCategories(req, res) {
        try {
            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            // Aggregate to get categories with item count
            const categories = await Category.aggregate([
                // Lấy ra các category thuộc nhà hàng và chưa bị xóa
                { 
                    $match: { 
                        restaurantId, 
                        isDeleted: false 
                    } 
                },
                // Join với MenuItem để đếm số món trong mỗi category
                {
                    $lookup: {
                        from: "menuitems",
                        localField: "_id",
                        foreignField: "categoryId",
                        as: "items"
                    }
                },
                // Thêm trường itemCount đếm số món
                {
                    $addFields: {
                        itemCount: { $size: "$items" }
                    }
                },
                //Loại bỏ field items khỏi response
                { $project: { items: 0 } }, // Don't send full items list
                { $sort: { order: 1, name: 1, createdAt: 1 } }
            ]);
            res.status(200).json({ categories });
        } catch (err) {
            console.error("Get Categories Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/categories
    async createCategory(req, res) {
        try {
            const { name, description, order, isActive } = req.body;

            // Validation
            if (!name || name.length < 2 || name.length > 50) {
                return res.status(400).json({ message: "Category name must be between 2 and 50 characters" });
            }

            if (order !== undefined && (isNaN(order) || order < 0)) {
                return res.status(400).json({ message: "Display order must be a non-negative integer" });
            }

            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }
            
            const category = await Category.create({
                restaurantId,
                name,
                description,
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true
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
            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            // Kiểm tra category có thuộc nhà hàng này không
            const category = await Category.findOne({ _id: id, restaurantId });
            if (!category) return res.status(404).json({ message: "Category not found or unauthorized" });

            // Soft delete
            category.isDeleted = true;
            await category.save();

            // Tạm thời set items về unavailable thay vì unset categoryId để dễ khôi phục
            await MenuItem.updateMany({ categoryId: id }, { $set: { isAvailable: false } });

            res.status(200).json({ message: "Category deleted" });
        } catch (err) {
            console.error("Delete Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }


    // [GET] /api/categories/trash
    async getTrashCategories(req, res) {
        try {
            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            const categories = await Category.find({ 
                restaurantId, 
                isDeleted: true 
            }).sort({ updatedAt: -1 });

            res.status(200).json({ categories });
        } catch (err) {
            console.error("Get Trash Categories Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/categories/:id
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            console.log("Update Category Request Body:", req.body);
            const { name, description, order, isActive } = req.body;

            if (!name) return res.status(400).json({ message: "Category name is required" });

           let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            const category = await Category.findOne({ _id: id, restaurantId });
            if (!category) return res.status(404).json({ message: "Category not found" });

            if (name) {
                if (name.length < 2 || name.length > 50) {
                    return res.status(400).json({ message: "Category name must be between 2 and 50 characters" });
                }
                category.name = name;
            }

            if (description !== undefined) category.description = description;
            if (order !== undefined) {
                 if (isNaN(order) || order < 0) return res.status(400).json({ message: "Order must be non-negative" });
                 category.order = order;
            }
            
            if (isActive !== undefined) {
                category.isActive = isActive;
                
                // Nếu category bị inactive, update tất cả món ăn thuộc category đó thành unavailable
                if (isActive === false || isActive === 'false') {
                    await MenuItem.updateMany(
                        { categoryId: category._id },
                        { $set: { isAvailable: false } }
                    );
                }
            }

            await category.save();

            res.status(200).json({ message: "Category updated", category });
        } catch (err) {
            console.error("Update Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }



    // [DELETE] /api/categories/:id/force (Hard Delete)
    async forceDeleteCategory(req, res) {
        try {
            const { id } = req.params;
            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            const category = await Category.findOneAndDelete({ _id: id, restaurantId });
            if (!category) return res.status(404).json({ message: "Category not found" });

            // Khi xóa vĩnh viễn, set categoryId của các món ăn về null
            await MenuItem.updateMany({ categoryId: id }, { $unset: { categoryId: "" } });

            res.status(200).json({ message: "Category permanently deleted" });
        } catch (err) {
            console.error("Force Delete Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/categories/:id/restore (MỚI)
    async restoreCategory(req, res) {
        try {
            const { id } = req.params;
            let restaurantId = req.user.restaurantId;
            if (!restaurantId) {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
                restaurantId = restaurant._id;
            }

            const category = await Category.findOne({ _id: id, restaurantId });
            if (!category) return res.status(404).json({ message: "Category not found" });

            category.isDeleted = false;
            await category.save();

            // Có thể cân nhắc restore trạng thái món ăn, nhưng an toàn nhất là để user tự active lại món ăn
            // Hoặc chỉ active lại nếu category active
            if (category.isActive) {
                 // Tùy chọn: Khôi phục trạng thái món ăn (cần logic phức tạp hơn để biết món nào trước đó active)
                 // Ở đây ta chỉ khôi phục category, user sẽ tự vào menu chỉnh lại status món ăn
            }

            res.status(200).json({ message: "Category restored", category });
        } catch (err) {
            console.error("Restore Category Error:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/categories/public/:restaurantId
    async getPublicCategories(req, res) {
        try {
            const { restaurantId } = req.params;
            
            // Lấy category active của nhà hàng đó
            const categories = await Category.aggregate([
                { 
                    $match: { 
                        restaurantId: new mongoose.Types.ObjectId(restaurantId), 
                        isDeleted: false,
                        isActive: true 
                    } 
                },
                { $sort: { order: 1, name: 1 } }
            ]);
            res.status(200).json({ categories });
        } catch (err) {
            console.error("Get Public Categories Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
}
export default new CategoryController();