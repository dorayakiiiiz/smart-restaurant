import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Table from "../models/Table.mjs";
import MenuItem from "../models/MenuItem.mjs";
import Restaurant from "../models/Restaurant.mjs";

class OrderController {
    
    // [POST] /api/orders/session/start
    // Body: { tableToken }
    async startSession(req, res) {
        try {
            const { tableToken } = req.body;
            
            // 1. Tìm bàn dựa trên Token QR
            const table = await Table.findOne({ token: tableToken });
            if (!table) return res.status(404).json({ message: "Invalid QR Code" });

            // 2. Nếu bàn đang có khách (Occupied) -> Trả về Session hiện tại
            if (table.status === 'occupied' && table.currentSessionId) {
                const session = await OrderSession.findById(table.currentSessionId)
                    .populate('tableId')
                    .populate('restaurantId');
                return res.status(200).json({ message: "Session resumed", session });
            }

            // 3. Nếu bàn trống -> Tạo Session mới
            const newSession = await OrderSession.create({
                restaurantId: table.restaurantId,
                tableId: table._id,
                customerId: req.user ? req.user.id : null, // Có thể là null nếu là Guest chưa login
                status: 'active'
            });

            // Cập nhật trạng thái bàn
            table.status = 'occupied';
            table.currentSessionId = newSession._id;
            await table.save();

            res.status(201).json({ message: "Session started", session: newSession });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/orders
    // Body: { sessionId, items: [{ menuItemId, quantity, modifiers, note }] }
    async placeOrder(req, res) {
        try {
            const { sessionId, items } = req.body;

            const session = await OrderSession.findById(sessionId);
            if (!session || session.status !== 'active') {
                return res.status(400).json({ message: "Session is not active" });
            }

            // 1. Tính toán giá tiền server-side (để tránh hack giá từ frontend)
            let orderItems = [];
            let orderTotal = 0;

            for (const item of items) {
                const menuItem = await MenuItem.findById(item.menuItemId);
                if (!menuItem) continue;

                let itemPrice = menuItem.price;
                
                // Tính tiền modifiers (Size, Topping)
                // Logic này cần khớp với cấu trúc modifiers bạn gửi lên
                if (item.modifiers) {
                    item.modifiers.forEach(mod => {
                        itemPrice += (mod.price || 0);
                    });
                }

                orderItems.push({
                    menuItemId: menuItem._id,
                    name: menuItem.name,
                    price: itemPrice,
                    quantity: item.quantity,
                    modifiers: item.modifiers,
                    note: item.note,
                    status: 'pending'
                });

                orderTotal += itemPrice * item.quantity;
            }

            // 2. Tạo Order con
            const newOrder = await Order.create({
                restaurantId: session.restaurantId,
                sessionId: session._id,
                orderedBy: req.user ? req.user.id : null,
                items: orderItems,
                status: 'pending' // Chờ Waiter duyệt
            });

            // 3. Cập nhật tổng tiền vào Session cha
            session.totalAmount += orderTotal;
            await session.save();

            // TODO: Emit Socket.IO tới Waiter/Kitchen tại đây

            res.status(201).json({ message: "Order placed successfully", order: newOrder });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/orders/session/:sessionId
    // Lấy chi tiết hóa đơn (gồm tất cả các lần gọi món)
    async getSessionDetails(req, res) {
        try {
            const { sessionId } = req.params;
            
            const session = await OrderSession.findById(sessionId)
                .populate('tableId')
                .populate('restaurantId');

            // Lấy tất cả các order con thuộc session này
            const orders = await Order.find({ sessionId }).sort({ createdAt: -1 });

            res.status(200).json({ session, orders });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/orders/session/:sessionId/checkout
    // Khách yêu cầu thanh toán
    async requestCheckout(req, res) {
        try {
            const { sessionId } = req.params;
            const { paymentMethod } = req.body;

            const session = await OrderSession.findById(sessionId);
            if (!session) return res.status(404).json({ message: "Session not found" });

            session.status = 'payment_requested';
            session.paymentMethod = paymentMethod;
            await session.save();

            // TODO: Emit Socket tới Waiter để mang bill ra

            res.status(200).json({ message: "Bill requested", session });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

export default new OrderController();