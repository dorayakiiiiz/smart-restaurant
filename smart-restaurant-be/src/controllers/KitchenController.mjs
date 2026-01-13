import Order from "../models/Order.mjs";
import Restaurant from "../models/Restaurant.mjs";

class KitchenController {

    // [GET] /api/kitchen/orders
    async getIncomingOrders(req, res) {
        try {

            let restaurantId;

            // 1. Nếu user là nhân viên (có restaurantId trong profile)
            if (req.user.restaurantId) {
                restaurantId = req.user.restaurantId;
            } 
            // 2. Nếu user là Admin (chủ nhà hàng)
            else {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (restaurant) {
                    restaurantId = restaurant._id;
                }
            }

            if (!restaurantId) {
                return res.status(404).json({ message: "Restaurant not found for this user" });
            }

            const orders = await Order.find({
                restaurantId,
                // Chỉ lấy các order có một trong các trạng thái sau
                status: { $in: ['accepted', 'preparing', 'ready'] } 
            })
            .populate([
                {
                    path: 'sessionId',
                    populate: {
                        path: 'tableId',
                        model: 'Table',
                        select: 'name'
                    }
                },
                {
                    // Populate field menuItemId nằm bên trong mảng items
                    path: 'items.menuItemId',
                    select: 'prepTime' // Chỉ lấy field prepTime để tối ưu hiệu suất
                }
            ])
            .sort({ createdAt: 1 });


            const formattedOrders = orders.map(order => {             
                return {

                    id: order._id,
                    table: order.sessionId?.tableId?.name || 'Unknown',
                    status: order.status,
                    createdAt: order.createdAt,
                    acceptedAt: order.acceptedAt, // Thêm trường này
                    preparingAt: order.preparingAt, // Thêm trường nà
                    items: order.items.map(item => ({
                        
                        itemId: item._id,
                        name: item.name,
                        qty: item.quantity,
                        note: item.note,
                        modifiers: item.modifiers,
                        status: item.status,
                        prepTime: item.menuItemId?.prepTime || 15,
                        finishedAt: item.finishedAt
                    }))
                };
            });

            res.status(200).json(formattedOrders);
        } catch (error) {
            console.error("Get incoming orders error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // [PATCH] /api/kitchen/orders/:orderId/status
    async updateItemStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status, itemId } = req.body;

            const order = await Order.findById(orderId)
                .populate({
                    path: 'sessionId',
                    populate: { path: 'tableId', select: 'name' }
                })
                .populate('acceptedBy', 'fullName email role')
                .populate('preparedBy', 'fullName email role')
                .populate('servedBy', 'fullName email role');
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            const io = req.app.get('socketio');
            const restaurantId = order.restaurantId.toString();
            const sessionId = order.sessionId._id.toString();

            // Case 1: Update status của cả Order (Accept & Start Cooking)
            if (!itemId) {
                if (status === 'preparing') {
                    order.status = 'preparing';
                    order.preparingAt = new Date();
                    order.preparedBy = req.user.id;
                    order.items.forEach(item => { item.status = 'preparing'; });
                } else if (status === 'ready') {
                    order.status = 'ready';
                    order.readyAt = new Date();
                    order.items.forEach(item => { item.status = 'ready'; item.finishedAt = new Date(); });
                }
            } else {
                // Case 2: Update status của từng Item
                const item = order.items.id(itemId);
                if (!item) return res.status(404).json({ message: "Item not found" });

                item.status = status;
                if (status === 'ready') item.finishedAt = new Date();
                if (status === 'preparing') item.finishedAt = null;

                // Auto-update order status
                const itemStatuses = order.items.map(i => i.status);
                const allServed = itemStatuses.every(s => s === 'served');
                const allReady = itemStatuses.every(s => s === 'ready');
                const allAccepted = itemStatuses.every(s => s === 'accepted');

                if (allServed) {
                    order.status = 'served';
                } else if (allReady) {
                    order.status = 'ready';
                    if (!order.readyAt) order.readyAt = new Date();
                } else if (allAccepted) {
                    order.status = 'accepted';
                } else {
                    order.status = 'preparing';
                }
            }

            await order.save();

            // 1. Chuẩn bị data cho Kitchen (Format phẳng)
            const kitchenFormat = {
                id: order._id,
                table: order.sessionId?.tableId?.name || 'Unknown',
                status: order.status,
                createdAt: order.createdAt,
                acceptedAt: order.acceptedAt,
                preparingAt: order.preparingAt,
                items: order.items.map(item => ({
                    itemId: item._id,
                    name: item.name,
                    qty: item.quantity, // Map quantity -> qty
                    note: item.note,
                    modifiers: item.modifiers,
                    status: item.status,
                    // prepTime có thể bị thiếu nếu không populate lại, 
                    // nhưng update status thì FE có thể lấy từ cache cũ nên tạm chấp nhận hoặc populate thêm.
                    finishedAt: item.finishedAt
                }))
            };

            // 2. Data cho Waiter/Customer (Format gốc)
            const standardFormat = order;

            // --- EMIT SOCKET (3 điểm đến) ---
            // 1. Customer (session room) - Cập nhật UI tracking
            io.to(`session_${sessionId}`).emit('order_update', standardFormat);

            // 2. Kitchen (kitchen room) - Sync giữa các thiết bị bếp
            io.to(`restaurant_${restaurantId}_kitchen`).emit('kitchen:order_update', kitchenFormat);

            // 3. Waiter (waiter room) - Cập nhật tab Accepted/Ready
            io.to(`restaurant_${restaurantId}_waiter`).emit('kitchen:order_update', standardFormat);
            io.to(`restaurant_${restaurantId}_admin`).emit('kitchen:order_update', standardFormat);
            
            // 3b. Emit riêng event `waiter:order_ready` khi có món ready
            if (status === 'ready' || order.status === 'ready') {
              io.to(`restaurant_${restaurantId}_waiter`).emit('waiter:order_ready', order);
              io.to(`restaurant_${restaurantId}_admin`).emit('waiter:order_ready', order);
            }

            res.status(200).json({ message: "Status updated", order });
        } catch (error) {
            console.error("Update status error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // [GET] /api/kitchen/history
    async getHistory(req, res) {
        try {
            let restaurantId;

            // 1. Nếu user là nhân viên (có restaurantId trong profile)
            if (req.user.restaurantId) {
                restaurantId = req.user.restaurantId;
            } 
            // 2. Nếu user là Admin (chủ nhà hàng)
            else {
                const restaurant = await Restaurant.findOne({ adminId: req.user.id });
                if (restaurant) {
                    restaurantId = restaurant._id;
                }
            }

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const orders = await Order.find({
                restaurantId,
                
                "items.status": "served" // Tìm các order có ít nhất 1 món đã served
            })
            //2 lớp
            .populate({
                path: 'sessionId',
                populate: {
                    path: 'tableId',
                    model: 'Table',
                    select: 'name' // Chỉ lấy field name của bàn
                }
            })
            .sort({ updatedAt: -1 })
            .limit(50);

            const formattedHistory = orders.map(order => {
                // Chỉ lấy các món đã served
                const servedItems = order.items.filter(item => item.status === 'served');

                return {
                    id: order._id,
                    table: order.sessionId?.tableId?.name || 'Unknown',
                    updatedAt: order.updatedAt,
                    items: servedItems.map(i => ({
                        itemId: i._id,
                        name: i.name,
                        qty: i.quantity,
                        status: i.status                  
                    }))
                };
            });

            res.status(200).json(formattedHistory);
        } catch (error) {
            console.error("Get history error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new KitchenController();