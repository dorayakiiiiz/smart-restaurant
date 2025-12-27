import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Table from "../models/Table.mjs";

class WaiterController {
    
    // [GET] /api/waiter/orders?status=pending|accepted|ready (single or comma-separated: pending,accepted)
    // Consolidated endpoint to get orders by status
    async getOrdersByStatus(req, res) {
        try {
            const { status } = req.query;
            const restaurantId = req.user.restaurantId;

            if (!status) {
                return res.status(400).json({ 
                    message: "Status parameter is required. Use 'pending', 'accepted', 'ready', or comma-separated like 'pending,accepted'" 
                });
            }

            // Parse status: support single or comma-separated values
            const statusArray = status.split(',').map(s => s.trim());
            const validStatuses = ['pending', 'accepted', 'ready'];
            
            // Validate all statuses
            const invalidStatuses = statusArray.filter(s => !validStatuses.includes(s));
            if (invalidStatuses.length > 0) {
                return res.status(400).json({ 
                    message: `Invalid status: ${invalidStatuses.join(', ')}. Use 'pending', 'accepted', or 'ready'` 
                });
            }

            // Build base query
            const query = {};
            if (restaurantId) {
                query.restaurantId = restaurantId;
            }

            let orders = [];

            // Handle each status type
            for (const statusType of statusArray) {
                if (statusType === 'pending') {
                    // Get pending orders
                    const pendingOrders = await Order.find({ ...query, status: 'pending' })
                        .populate({
                            path: 'sessionId',
                            populate: { path: 'tableId', select: 'name' }
                        })
                        .sort({ createdAt: -1 });
                    orders.push(...pendingOrders);

                } else if (statusType === 'accepted') {
                    // Get accepted orders (in kitchen, not all items ready)
                    const acceptedOrders = await Order.find({ ...query, status: 'accepted' })
                        .populate({
                            path: 'sessionId',
                            populate: { path: 'tableId', select: 'name' }
                        })
                        .sort({ createdAt: -1 });

                    // Filter: Loại bỏ orders có tất cả items đã ready
                    const filteredAccepted = acceptedOrders.filter(order => 
                        !order.items.every(item => item.status === 'ready')
                    );
                    orders.push(...filteredAccepted);

                } else if (statusType === 'ready') {
                    // Get ready orders (all items ready to serve)
                    const acceptedOrders = await Order.find({ ...query, status: 'accepted' })
                        .populate({
                            path: 'sessionId',
                            populate: { path: 'tableId', select: 'name' }
                        })
                        .sort({ createdAt: -1 });

                    // Filter: Chỉ lấy orders có tất cả items status = 'ready'
                    const filteredReady = acceptedOrders.filter(order => 
                        order.items.length > 0 && 
                        order.items.every(item => item.status === 'ready')
                    );
                    orders.push(...filteredReady);
                }
            }

            // Remove duplicates by order ID (in case of overlapping queries)
            const uniqueOrders = Array.from(
                new Map(orders.map(order => [order._id.toString(), order])).values()
            );

            res.status(200).json({ orders: uniqueOrders });

        } catch (err) {
            console.error('Error in getOrdersByStatus:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/waiter/orders/:id/status
    // Update order status: accept hoặc reject
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;

            // Validate status
            if (!status || !['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({ 
                    message: "Invalid status. Use 'accepted' or 'rejected'" 
                });
            }

            const order = await Order.findById(id).populate('sessionId');
            if (!order) return res.status(404).json({ message: "Order not found" });

            const io = req.app.get('socketio');
            const restaurantId = order.restaurantId.toString();
            const sessionId = order.sessionId._id.toString();

            if (status === 'accepted') {
                // Waiter accept order → Gửi vào bếp
                order.status = 'accepted';
                await order.save();

                // Cập nhật tổng tiền vào Session (chỉ khi accept)
                const session = order.sessionId;
                let orderTotal = 0;
                order.items.forEach(item => {
                    orderTotal += item.price * item.quantity;
                });
                session.totalAmount += orderTotal;
                await session.save();

                // Emit socket tới waiter, kitchen và customer
                io.to(`restaurant_${restaurantId}_waiter`).emit('order_accepted', order);
                io.to(`restaurant_${restaurantId}_kitchen`).emit('order_accepted', order);
                io.to(`session_${sessionId}`).emit('order_update', order);

                res.status(200).json({ message: "Order accepted", order });

            } else if (status === 'rejected') {
                // Waiter reject order
                order.status = 'rejected';
                order.rejectionReason = rejectionReason || 'No reason provided';
                await order.save();

                // Emit socket tới waiter và customer
                io.to(`restaurant_${restaurantId}_waiter`).emit('order_rejected', order);
                io.to(`session_${sessionId}`).emit('order_update', order);

                res.status(200).json({ message: "Order rejected", order });
            }

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/waiter/orders/:id/serve
    // Đánh dấu tất cả items trong order đã được phục vụ
    async markAsServed(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findById(id).populate('sessionId');
            if (!order) return res.status(404).json({ message: "Order not found" });

            // Update tất cả items thành served
            order.items.forEach(item => {
                item.status = 'served';
            });
            await order.save();

            // Emit socket tới waiter, kitchen và customer
            const io = req.app.get('socketio');
            const restaurantId = order.restaurantId.toString(); // Convert ObjectId to string
            const sessionId = order.sessionId._id.toString();

            io.to(`restaurant_${restaurantId}_waiter`).emit('order_served', order);
            io.to(`restaurant_${restaurantId}_kitchen`).emit('order_served', order);
            io.to(`session_${sessionId}`).emit('order_update', order);

            res.status(200).json({ message: "Order marked as served", order });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/waiter/tables
    // Lấy danh sách bàn đang active hoặc chờ thanh toán với thông tin chi tiết orders
    async getTableStatus(req, res) {
        try {
            const restaurantId = req.user.restaurantId;

            // Nếu user không có restaurantId, lấy tất cả sessions
            const query = { status: { $in: ['active', 'payment_requested'] } };
            if (restaurantId) {
                query.restaurantId = restaurantId;
            }

            const sessions = await OrderSession.find(query)
                .populate('tableId', 'name')
                .sort({ startTime: -1 });

            // Lấy tất cả orders cho mỗi session và tính stats
            const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
                // Lấy tất cả orders của session này (chỉ lấy accepted, không lấy pending/rejected)
                const orders = await Order.find({ 
                    sessionId: session._id,
                    status: { $in: ['accepted'] } // Chỉ lấy orders đã được waiter accept
                });

                // Tính toán stats
                let totalItems = 0;
                let itemsPending = 0;
                let itemsPreparing = 0;
                let itemsReady = 0;
                let itemsServed = 0;

                orders.forEach(order => {
                    order.items.forEach(item => {
                        totalItems += item.quantity;
                        
                        if (item.status === 'pending' || item.status === 'confirmed') {
                            itemsPending += item.quantity;
                        } else if (item.status === 'preparing') {
                            itemsPreparing += item.quantity;
                        } else if (item.status === 'ready') {
                            itemsReady += item.quantity;
                        } else if (item.status === 'served') {
                            itemsServed += item.quantity;
                        }
                    });
                });

                return {
                    ...session.toObject(),
                    orderStats: {
                        totalOrders: orders.length,
                        totalItems,
                        itemsPending,
                        itemsPreparing,
                        itemsReady,
                        itemsServed
                    }
                };
            }));

            // Filter: Chỉ trả về sessions có ít nhất 1 order accepted hoặc đang payment_requested
            const filteredSessions = sessionsWithStats.filter(session => 
                session.orderStats.totalOrders > 0 || session.status === 'payment_requested'
            );

            res.status(200).json({ sessions: filteredSessions });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

 
    // [POST] /api/waiter/checkout/:sessionId
    // Xác nhận thanh toán và giải phóng bàn
    async confirmPayment(req, res) {
        try {
            const { sessionId } = req.params;

            const session = await OrderSession.findById(sessionId).populate('tableId');
            if (!session) return res.status(404).json({ message: "Session not found" });

            // Validate: Chỉ confirm khi status = payment_requested
            if (session.status !== 'payment_requested') {
                return res.status(400).json({ message: "Session is not ready for payment" });
            }

            // Update OrderSession
            session.status = 'completed';
            session.paymentStatus = 'paid';
            session.endTime = Date.now();
            await session.save();

            // Update Table: Giải phóng bàn
            const table = await Table.findById(session.tableId._id);
            if (table) {
                table.status = 'free';
                table.currentSessionId = null;
                await table.save();
            }

            // Emit socket tới waiter
            const io = req.app.get('socketio');
            const restaurantId = session.restaurantId.toString(); // Convert ObjectId to string
            io.to(`restaurant_${restaurantId}_waiter`).emit('payment_completed', { 
                sessionId: session._id,
                tableId: session.tableId._id
            });

            res.status(200).json({ message: "Payment confirmed", session });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new WaiterController();