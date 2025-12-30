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
          message:
            "Status parameter is required. Use 'pending', 'accepted', 'ready', or comma-separated like 'pending,accepted'",
        });
      }

      // Parse status: support single or comma-separated values
      const statusArray = status.split(",").map((s) => s.trim());
      const validStatuses = ["pending", "accepted", "ready"];

      // Validate all statuses
      const invalidStatuses = statusArray.filter(
        (s) => !validStatuses.includes(s)
      );
      if (invalidStatuses.length > 0) {
        return res.status(400).json({
          message: `Invalid status: ${invalidStatuses.join(
            ", "
          )}. Use 'pending', 'accepted', or 'ready'`,
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
        if (statusType === "pending") {
          // Get pending orders
          const pendingOrders = await Order.find({
            ...query,
            status: "pending",
          })
            .populate({
              path: "sessionId",
              populate: { path: "tableId", select: "name" },
            })
            .populate('acceptedBy', 'fullName email role')
            .populate('preparedBy', 'fullName email role')
            .populate('servedBy', 'fullName email role')
            .sort({ createdAt: -1 });
          orders.push(...pendingOrders);
        } else if (statusType === "accepted") {
          // Get accepted orders (in kitchen, not all items ready)
          const acceptedOrders = await Order.find({
            ...query,
            status: { $in: ["accepted", "preparing"] },
          })
            .populate({
              path: "sessionId",
              populate: { path: "tableId", select: "name" },
            })
            .populate('acceptedBy', 'fullName email role')
            .populate('preparedBy', 'fullName email role')
            .populate('servedBy', 'fullName email role')
            .sort({ createdAt: -1 });

          // Filter: Loại bỏ orders có tất cả items đã ready hoặc served
          const filteredAccepted = acceptedOrders.filter(
            (order) =>
              !order.items.every((item) =>
                ["ready", "served"].includes(item.status)
              )
          );
          orders.push(...filteredAccepted);
        } else if (statusType === "ready") {
          // Get ready orders (items ready to serve)
          // Tìm cả accepted, preparing và ready vì order có thể chưa full ready nhưng có món ready
          const acceptedOrders = await Order.find({
            ...query,
            status: { $in: ["accepted", "preparing", "ready"] },
          })
            .populate({
              path: "sessionId",
              populate: { path: "tableId", select: "name" },
            })
            .populate('acceptedBy', 'fullName email role')
            .populate('preparedBy', 'fullName email role')
            .populate('servedBy', 'fullName email role')
            .sort({ createdAt: -1 });

          // Filter: Lấy TẤT CẢ orders đã accepted (cooking, ready, hoặc served chưa complete)
          const filteredReady = acceptedOrders.filter((order) => {
            if (order.items.length === 0) return false;

            // Loại bỏ orders đã hoàn thành (tất cả served VÀ order.status = 'served')
            const allServed = order.items.every(
              (item) => item.status === "served"
            );
            if (allServed && order.status === 'served') return false;

            // Hiển thị tất cả orders còn lại (có món preparing, ready, hoặc served chưa complete)
            return true;
          });
          orders.push(...filteredReady);
        }
      }

      // Remove duplicates by order ID (in case of overlapping queries)
      const uniqueOrders = Array.from(
        new Map(orders.map((order) => [order._id.toString(), order])).values()
      );

      res.status(200).json({ orders: uniqueOrders });
    } catch (err) {
      console.error("Error in getOrdersByStatus:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/waiter/orders/all
  // Lấy TẤT CẢ orders của nhà hàng (bao gồm completed) - Dành cho Admin
  async getAllOrders(req, res) {
    try {
      const restaurantId = req.user?.restaurantId;

      // Query: Nếu có restaurantId thì filter, không thì lấy tất cả
      const query = restaurantId ? { restaurantId } : {};

      const orders = await Order.find(query)
      .populate({
        path: 'sessionId',
        populate: { path: 'tableId', select: 'name' }
      })
      .populate('acceptedBy', 'fullName email role')
      .populate('preparedBy', 'fullName email role')
      .populate('servedBy', 'fullName email role')
      .sort({ createdAt: -1 });

      res.status(200).json({ orders });
      
    } catch (err) {
      console.error('Error in getAllOrders:', err);
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
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Use 'accepted' or 'rejected'",
        });
      }

      const order = await Order.findById(id).populate({
        path: "sessionId",
        populate: { path: "tableId", select: "name" },
      });
      if (!order) return res.status(404).json({ message: "Order not found" });

      const io = req.app.get("socketio");
      const restaurantId = order.restaurantId.toString();
      const sessionId = order.sessionId._id.toString();

      if (status === "accepted") {
        order.status = "accepted";
        order.acceptedAt = new Date();
        order.acceptedBy = req.user.id;
        await order.save();

        const session = await OrderSession.findById(order.sessionId._id);
        let orderTotal = 0;
        order.items.forEach((item) => {
          orderTotal += item.price * item.quantity;
        });
        session.totalAmount += orderTotal;
        await session.save();

        const populatedOrder = await Order.findById(order._id)
          .populate({
            path: "sessionId",
            populate: { path: "tableId", select: "name" },
          })
          .populate('acceptedBy', 'fullName email role')
          .populate('preparedBy', 'fullName email role')
          .populate('servedBy', 'fullName email role');

        io.to(`restaurant_${restaurantId}_waiter`).emit(
          "order_accepted",
          populatedOrder
        );
        io.to(`restaurant_${restaurantId}_admin`).emit(
          "order_accepted",
          populatedOrder
        );
        io.to(`restaurant_${restaurantId}_kitchen`).emit(
          "order_accepted",
          {...populatedOrder.toObject(), acceptedTime: Date.now()}
        );
        io.to(`session_${sessionId}`).emit("order_update", populatedOrder);

        res.status(200).json({ message: "Order accepted", order: populatedOrder });
      } else if (status === "rejected") {
        order.status = "rejected";
        order.rejectionReason = rejectionReason || "No reason provided";
        await order.save();

        const populatedOrder = await Order.findById(order._id)
          .populate({
            path: "sessionId",
            populate: { path: "tableId", select: "name" },
          })
          .populate('acceptedBy', 'fullName email role')
          .populate('preparedBy', 'fullName email role')
          .populate('servedBy', 'fullName email role');

        io.to(`restaurant_${restaurantId}_waiter`).emit(
          "order_rejected",
          populatedOrder
        );
        io.to(`restaurant_${restaurantId}_admin`).emit(
          "order_rejected",
          populatedOrder
        );
        io.to(`session_${sessionId}`).emit("order_update", populatedOrder);

        res.status(200).json({ message: "Order rejected", order: populatedOrder });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [PATCH] /api/waiter/orders/:id/serve
  // Đánh dấu các items READY trong order đã được phục vụ VÀ thông báo customer
  async markAsServed(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id)
        .populate({
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        })
        .populate('acceptedBy', 'fullName email role')
        .populate('preparedBy', 'fullName email role')
        .populate('servedBy', 'fullName email role');
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Chỉ update items có status = 'ready' thành 'served'
      order.items.forEach((item) => {
        if (item.status === "ready") {
          item.status = "served";
        }
      });

      order.servedBy = req.user.id;
      order.servedAt = new Date();

      await order.save();

      // Populate lại đầy đủ sau khi save
      await order.populate([
        {
          path: 'sessionId',
          populate: { path: 'tableId', select: 'name' }
        },
        { path: 'acceptedBy', select: 'fullName email' },
        { path: 'preparedBy', select: 'fullName email' },
        { path: 'servedBy', select: 'fullName email' }
      ]);

      // Emit socket tới waiter, kitchen VÀ customer
      const io = req.app.get("socketio");
      const restaurantId = order.restaurantId.toString();
      const sessionId = order.sessionId._id.toString();

      io.to(`restaurant_${restaurantId}_waiter`).emit("order_served", order);
      io.to(`restaurant_${restaurantId}_admin`).emit("order_served", order);
      io.to(`restaurant_${restaurantId}_kitchen`).emit("order_served", order);
      io.to(`session_${sessionId}`).emit("order_update", order); // Emit tới customer

      res.status(200).json({
        message: "Items marked as served and customer notified",
        order,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [PATCH] /api/waiter/orders/:id/complete
  // Đánh dấu order hoàn thành (tất cả items đã served) → Update order status 'served'
  async markOrderComplete(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findById(id)
        .populate({
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        })
        .populate('acceptedBy', 'fullName email role')
        .populate('preparedBy', 'fullName email role')
        .populate('servedBy', 'fullName email role');
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Validate: Tất cả items phải served
      const allServed = order.items.every((item) => item.status === "served");
      if (!allServed) {
        return res
          .status(400)
          .json({ message: "Not all items are served yet" });
      }

      // Update order status thành 'served' (order hoàn thành)
      order.status = "served";
      await order.save();

      // Populate lại đầy đủ sau khi save
      await order.populate([
        {
          path: 'sessionId',
          populate: { path: 'tableId', select: 'name' }
        },
        { path: 'acceptedBy', select: 'fullName email' },
        { path: 'preparedBy', select: 'fullName email' },
        { path: 'servedBy', select: 'fullName email' }
      ]);

      // Emit socket tới waiter, kitchen VÀ customer
      const io = req.app.get("socketio");
      const restaurantId = order.restaurantId.toString();
      const sessionId = order.sessionId._id.toString();

      io.to(`restaurant_${restaurantId}_waiter`).emit("order_completed", order);
      io.to(`restaurant_${restaurantId}_admin`).emit("order_completed", order);
      io.to(`restaurant_${restaurantId}_kitchen`).emit(
        "order_completed",
        order
      );
      io.to(`session_${sessionId}`).emit("order_update", order); // Customer nhận order status 'served'

      res
        .status(200)
        .json({ message: "Order completed and customer notified", order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/waiter/tables
  // Lấy danh sách bàn đang active hoặc chờ thanh toán
  async getTableStatus(req, res) {
    try {
      const restaurantId = req.user.restaurantId;

      // 1. Lấy TẤT CẢ session đang hoạt động (Active hoặc Đang chờ thanh toán)
      // KHÔNG lọc theo order status ở đây, để tránh mất bàn khi đã serve hết món
      const sessions = await OrderSession.find({
        restaurantId,
        status: { $in: ['active', 'payment_requested'] }
      })
      .populate('tableId', 'name')
      .sort({ startTime: -1 }); // Bàn mới nhất lên đầu

      // 2. Tính toán thống kê Order cho từng session
      const sessionData = await Promise.all(sessions.map(async (session) => {
        // Lấy tất cả order của session này
        const orders = await Order.find({ sessionId: session._id });

        let stats = {
          totalOrders: orders.length,
          pending: 0,   // Chờ bếp nhận
          accepted: 0,  // Đang nấu (accepted + preparing)
          ready: 0,     // Chờ serve
          served: 0     // Đã ăn
        };

        // Duyệt qua từng món để đếm status (chính xác hơn đếm theo order)
        orders.forEach(order => {
            order.items.forEach(item => {
                if (['pending'].includes(item.status)) stats.pending++;
                if (['accepted', 'preparing'].includes(item.status)) stats.accepted++;
                if (['ready'].includes(item.status)) stats.ready++;
                if (['served'].includes(item.status)) stats.served++;
            });
        });

        return {
          ...session.toObject(),
          orderStats: stats // Trả về stats để Frontend hiển thị badge
        };
      }));

      res.status(200).json({ sessions: sessionData });
    } catch (err) {
      console.error("Get table status error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // [POST] /api/waiter/checkout/:sessionId
  // Xác nhận thanh toán và giải phóng bàn
  async confirmPayment(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = await OrderSession.findById(sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });

      // Cập nhật trạng thái session thành completed
      session.status = 'completed';
      session.paymentStatus = 'paid';
      session.endTime = new Date();
      await session.save();

      // Cập nhật bàn về trạng thái free
      await Table.findByIdAndUpdate(session.tableId, {
        status: 'free',
        currentSessionId: null
      });

      const io = req.app.get("socketio");
      const restaurantId = session.restaurantId.toString();
      
      // 1. Báo cho Waiter (để xóa bàn khỏi danh sách)
      io.to(`restaurant_${restaurantId}_waiter`).emit("session_update", { sessionId, status: 'completed' });

      // 2. BÁO CHO CUSTOMER (ĐỂ XÓA DATA TRÊN ĐIỆN THOẠI)
      // Room này khách đã join lúc quét QR (xem file socket.js/CartContext)
      io.to(`session_${sessionId}`).emit("session_ended", { 
          message: "Payment confirmed. Thank you!" 
      });

      res.status(200).json({ message: "Payment confirmed, table closed", session });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new WaiterController();

