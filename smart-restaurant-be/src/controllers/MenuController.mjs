import MenuItem from "../models/MenuItem.mjs";
import Restaurant from "../models/Restaurant.mjs";
import Category from "../models/Category.mjs";
import Order from "../models/Order.mjs";

class MenuController {
    // [GET] /api/menu/public/:restaurantId
    async getPublicMenu(req, res) {
        try {
            const { restaurantId } = req.params;
            const items = await MenuItem.find({ 
                restaurantId,
                isDeleted: { $ne: true },
                isAvailable: true 
            })
            .populate('categoryId', 'name isActive')
            .sort({ createdAt: -1 });


            // Calculate order counts
            const orderCounts = await Order.aggregate([
                { $match: { restaurantId } },
                { $unwind: "$items" },
                { $group: {
                    _id: "$items.menuItemId",
                    totalOrders: { $sum: "$items.quantity" }
                }}
            ]);

            //Map order counts to items
            const ordersMap = {};
            orderCounts.forEach(doc => {
                if (doc._id) {
                    ordersMap[doc._id.toString()] = doc.totalOrders;
                }
            });

            const itemsWithOrders = items.map(item => ({
                ...item.toObject(),
                orderCount: ordersMap[item._id.toString()] || 0
            }));

            res.status(200).json({ items: itemsWithOrders });

        } catch (err) {
            res.status(500).json({ message: "Error fetching public menu", error: err.message });
        }
    }

    // [GET] /api/menu
    async getMenu(req, res) {
        try {
            // Tìm nhà hàng dựa trên adminId (người dùng đang đăng nhập)
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }
            // Lấy tất cả món ăn thuộc nhà hàng này, kèm thông tin category
            const items = await MenuItem.find({ 
                restaurantId: restaurant._id,
                isDeleted: { $ne: true } // Lấy item không có cờ isDeleted hoặc isDeleted = false
            })
                .populate('categoryId', 'name isActive') // Chỉ lấy tên category
                .sort({ createdAt: -1 }); // Mới nhất lên đầu

            // Calculate order counts
            const orderCounts = await Order.aggregate([
                { $match: { restaurantId: restaurant._id } },
                { $unwind: "$items" },
                { $group: {
                    _id: "$items.menuItemId",
                    totalOrders: { $sum: "$items.quantity" }
                }}
            ]);

            //Map order counts to items
            const ordersMap = {};
            orderCounts.forEach(doc => {
                if (doc._id) {
                    ordersMap[doc._id.toString()] = doc.totalOrders;
                }
            });

            const itemsWithOrders = items.map(item => ({
                ...item.toObject(),
                orderCount: ordersMap[item._id.toString()] || 0
            }));

            res.status(200).json({ items: itemsWithOrders });

        } catch (err) {
            console.error("Get Menu Error:", err);
            res.status(500).json({ message: "Internal Server Error", error: err.message });
        }
    }

    // [GET] /api/menu/public/:id/:restaurantId
    async getPublicMenuDetail(req, res) {
        try {
            const { id, restaurantId } = req.params;

            const item = await MenuItem.findOne({ _id: id, restaurantId })
                .populate('categoryId', 'name isActive');
            
            if (!item) return res.status(404).json({ message: "Item not found" });

            // Calculate order count for this specific item
            const orderCountResult = await Order.aggregate([
                { $match: { restaurantId } },
                { $unwind: "$items" },
                { $match: { "items.menuItemId": item._id } },
                { $group: {
                    _id: "$items.menuItemId",
                    totalOrders: { $sum: "$items.quantity" }
                }}
            ]);

            const orderCount = orderCountResult.length > 0 ? orderCountResult[0].totalOrders : 0;

            res.status(200).json({ item: { ...item.toObject(), orderCount } });

        } catch (err) {
            res.status(500).json({ message: "Error fetching item", error: err.message });
        }
    }

    // [GET] /api/menu/:id
    async getMenuItem(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const item = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id })
                .populate('categoryId', 'name isActive');
            
            if (!item) return res.status(404).json({ message: "Item not found" });

            // Calculate order count for this specific item
            const orderCountResult = await Order.aggregate([
                { $match: { restaurantId: restaurant._id } },
                { $unwind: "$items" },
                { $match: { "items.menuItemId": item._id } },
                { $group: {
                    _id: "$items.menuItemId",
                    totalOrders: { $sum: "$items.quantity" }
                }}
            ]);

            const orderCount = orderCountResult.length > 0 ? orderCountResult[0].totalOrders : 0;

            res.status(200).json({ item: { ...item.toObject(), orderCount } });
        } catch (err) {
            res.status(500).json({ message: "Error fetching item", error: err.message });
        }
    }



    // [POST] /api/menu
    async createMenuItem(req, res) {
        try {
            const { name, 
                    price, 
                    description, 
                    categoryId, 
                    prepTime, modifiers, 
                    isAvailable, isSoldOut, 
                    isChefRecommended 
                } = req.body;
            
            // 1. Validate input cơ bản
            if (!name || !price || !categoryId) {
                return res.status(400).json({ message: "Name, price, and category are required" });
            }

            //Validate
            const numPrice = Number(price);
            if (isNaN(numPrice) || numPrice < 0.01 || numPrice > 999999) {
                return res.status(400).json({ message: "Price must be between 0.01 and 999,999" });
            }

            if (!categoryId) {
                return res.status(400).json({ message: "Category is required" });
            }

            let numPrepTime = 15;
            if (prepTime !== undefined && prepTime !== "") {
                numPrepTime = Number(prepTime);
                if (isNaN(numPrepTime) || numPrepTime < 0 || numPrepTime > 240) {
                    return res.status(400).json({ message: "Preparation time must be between 0 and 240 minutes" });
                }
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

            // Xử lý ảnh
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map((file, index) => ({
                    url: file.path,
                    publicId: file.filename,
                    isPrimary: index === 0 // Ảnh đầu tiên là ảnh chính
                }));
            }
            // 4. Chuẩn bị dữ liệu
            const data = {
                restaurantId: restaurant._id,
                categoryId,
                name,
                price: numPrice,
                description,
                prepTime: numPrepTime,
                isAvailable: String(isAvailable) === 'true',
                isSoldOut: String(isSoldOut) === 'true',
                isChefRecommended: String(isChefRecommended) === 'true', 
                modifiers: modifiers ? JSON.parse(modifiers) : [],
                isDeleted: false,
                images,
            };



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

            // Validation update
            if (updates.name && (updates.name.length < 2 || updates.name.length > 80)) {
                return res.status(400).json({ message: "Name must be between 2 and 80 characters" });
            }
            if (updates.price) {
                const p = Number(updates.price);
                if (isNaN(p) || p < 0.01 || p > 999999) return res.status(400).json({ message: "Price must be valid" });
                updates.price = p;
            }
            if (updates.prepTime) {
                const t = Number(updates.prepTime);
                if (isNaN(t) || t < 0 || t > 240) return res.status(400).json({ message: "Prep time must be valid" });
                updates.prepTime = t;
            }

            // 2. Kiểm tra món ăn có tồn tại và thuộc nhà hàng này không
            const item = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id });
            if (!item) return res.status(404).json({ message: "Menu item not found" });

            // Xử lý upload thêm ảnh
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => ({
                    url: file.path,
                    publicId: file.filename,
                    isPrimary: false
                }));
                
                // Nếu item chưa có ảnh nào, set ảnh mới đầu tiên là primary
                if (item.images.length === 0 && newImages.length > 0) {
                    newImages[0].isPrimary = true;
                }
                
                // Push vào mảng images có sẵn
                //$ để báo là operator chứ không phải trường dữ liệu
                updates.$push = { images: { $each: newImages } };
            }

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
            if (updates.isChefRecommended !== undefined) 
                updates.isChefRecommended = String(updates.isChefRecommended) === 'true';
            
            // Xử lý category nếu có thay đổi
            if (updates.categoryId) {
                const category = await Category.findOne({ _id: updates.categoryId, restaurantId: restaurant._id });
                if (!category) return res.status(400).json({ message: "Invalid category" });
            }

            // Loại bỏ images khỏi updates trực tiếp vì ta dùng $push
            delete updates.images; 

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

            //Soft delete món ăn
            const deletedItem = await MenuItem.findOneAndUpdate(
                { _id: id, restaurantId: restaurant._id },
                { isDeleted: true },
                { new: true }
            );
            
            if (!deletedItem) {
                return res.status(404).json({ message: "Item not found or unauthorized" });
            }

            res.status(200).json({ message: "Item deleted successfully" });
        } catch (err) {
            console.error("Delete Menu Item Error:", err);
            res.status(500).json({ message: "Failed to delete item", error: err.message });
        }
    }



    // [DELETE] /api/menu/:id/images/:imageId
    async deleteMenuImage(req, res) {
        try {
            const { id, imageId } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            
            const item = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id });
            if (!item) return res.status(404).json({ message: "Item not found" });

            // Lọc bỏ ảnh cần xóa
            item.images = item.images.filter(img => img._id.toString() !== imageId);
            
            // Nếu xóa mất ảnh primary, set ảnh đầu tiên còn lại làm primary
            if (item.images.length > 0 && !item.images.some(img => img.isPrimary)) {
                item.images[0].isPrimary = true;
            }

            await item.save();
            res.status(200).json({ message: "Image removed", item });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/menu/:id/images/:imageId/primary
    async setPrimaryImage(req, res) {
        try {
            const { id, imageId } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            
            const item = await MenuItem.findOne({ _id: id, restaurantId: restaurant._id });
            if (!item) return res.status(404).json({ message: "Item not found" });

            // Reset tất cả về false, set ảnh được chọn về true
            item.images.forEach(img => {
                img.isPrimary = img._id.toString() === imageId;
            });

            await item.save();
            res.status(200).json({ message: "Primary image updated", item });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }


    // [GET] /api/menu/trash
    async getTrashMenu(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const items = await MenuItem.find({ 
                restaurantId: restaurant._id,
                isDeleted: true 
            })
            .populate('categoryId', 'name')
            .sort({ updatedAt: -1 });

            res.status(200).json({ items });
        } catch (err) {
            res.status(500).json({ message: "Error fetching trash", error: err.message });
        }
    }

    // [PATCH] /api/menu/:id/restore
    async restoreMenuItem(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            
            const item = await MenuItem.findOneAndUpdate(
                { _id: id, restaurantId: restaurant._id, isDeleted: true },
                { isDeleted: false },
                { new: true }
            );

            if (!item) return res.status(404).json({ message: "Item not found in trash" });

            res.status(200).json({ message: "Item restored successfully", item });
        } catch (err) {
            res.status(500).json({ message: "Error restoring item", error: err.message });
        }
    }

    // [DELETE] /api/menu/:id/force
    async forceDeleteMenuItem(req, res) {
        try {
            const { id } = req.params;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });

            const item = await MenuItem.findOneAndDelete({ 
                _id: id, 
                restaurantId: restaurant._id,
                isDeleted: true 
            });

            if (!item) return res.status(404).json({ message: "Item not found in trash" });

            // TODO: Delete images from Cloudinary if needed (optional but recommended)

            res.status(200).json({ message: "Item permanently deleted" });
        } catch (err) {
            res.status(500).json({ message: "Error deleting item", error: err.message });
        }
    }
}

export default new MenuController();