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
                status: { $in: ['accepted', 'preparing', 'ready'] } 
            })
            .populate('sessionId', 'tableId')
            .sort({ createdAt: 1 });

            console.log("Fetched incoming orders:", orders);

            const formattedOrders = orders.map(order => {             
                return {

                    id: order._id,
                    table: order.sessionId?.tableId ? `Table ${order.sessionId.tableId}` : 'Unknown Table', 
                    status: order.status,
                    createdAt: order.createdAt,
                    items: order.items.map(item => ({
                        
                        itemId: item._id,
                        name: item.name,
                        qty: item.quantity,
                        note: item.note,
                        modifiers: item.modifiers,
                        status: item.status 
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

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            // Case 1: Update status của cả Order (Accept & Start)
            if (!itemId) {
                // Chỉ update nếu status hợp lệ trong enum mới
                if (['preparing', 'ready', 'served'].includes(status)) {
                    order.status = status;
                    
                    // Đồng bộ status items nếu cần lúc chuyển từ rêceived -> preparing
                    if (status === 'preparing') {
                        order.items.forEach(item => {
                            if (item.status === 'pending') item.status = 'preparing';
                        });
                    }
                }
            }
            // Case 2: Update status của từng Item
            else if (itemId) {
                const item = order.items.id(itemId);
                if (item) {
                    item.status = status; 
                    
                    // Logic tự động cập nhật Order Status dựa trên Items (Optional)
                    // Ví dụ: Nếu tất cả items đều ready -> Order ready
                    const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
                    if (allReady && order.status !== 'served') {
                        order.status = 'ready';
                    }
                    
                    // Nếu tất cả items đều served -> Order served
                    const allServed = order.items.every(i => i.status === 'served');
                    if (allServed) {
                        order.status = 'served';
                    }
                }
            }

            await order.save();

            // Emit Socket
            const io = req.app.get('socketio');
            
            // 1. Notify Customer (session room)
            if (order.sessionId) {
                io.to(`session_${order.sessionId}`).emit('kitchen:order_update', {
                    id: order._id,
                    status: order.status,
                    itemId: itemId,
                    itemStatus: status,
                    updatedAt: new Date()
                });
            }

            // 2. Notify Waiter (waiter room)
            if (status === 'ready' || order.status === 'ready') {
                io.to(`restaurant_${order.restaurantId}_waiter`).emit('waiter:order_ready', {
                    orderId: order._id,
                    table: order.sessionId
                });
            }

            // 3. Notify Kitchen (kitchen room) - Sync across kitchen devices
            io.to(`restaurant_${order.restaurantId}_kitchen`).emit('kitchen:order_update', {
                id: order._id,
                status: order.status,
                itemId: itemId,
                itemStatus: status,
                updatedAt: new Date()
            });

            res.status(200).json({ message: "Status updated", order });
        } catch (error) {
            console.error("Update status error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // [GET] /api/kitchen/history
    async getHistory(req, res) {
        try {
            // Find restaurant by adminId
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) {
                return res.status(404).json({ message: "Restaurant not found" });
            }
            const restaurantId = restaurant._id;

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const orders = await Order.find({
                restaurantId,
                updatedAt: { $gte: startOfDay, $lte: endOfDay },
                status: 'served' // Lấy các order đã hoàn thành (served)
            })
            .populate('sessionId', 'tableId')
            .sort({ updatedAt: -1 })
            .limit(50);

            const formattedHistory = orders.map(order => ({
                id: order._id,
                table: order.sessionId?.tableId ? `Table ${order.sessionId.tableId}` : 'Unknown',
                updatedAt: order.updatedAt,
                items: order.items.map(i => ({
                    name: i.name,
                    qty: i.quantity,
                    status: i.status
                }))
            }));

            res.status(200).json(formattedHistory);
        } catch (error) {
            console.error("Get history error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default new KitchenController();