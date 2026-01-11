import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Table from "../models/Table.mjs";
import Restaurant from "../models/Restaurant.mjs";
import { generateBillPDF } from "../utils/billPdfHelper.mjs";

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
            .populate("acceptedBy", "fullName email role")
            .populate("preparedBy", "fullName email role")
            .populate("servedBy", "fullName email role")
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
            .populate("acceptedBy", "fullName email role")
            .populate("preparedBy", "fullName email role")
            .populate("servedBy", "fullName email role")
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
            .populate("acceptedBy", "fullName email role")
            .populate("preparedBy", "fullName email role")
            .populate("servedBy", "fullName email role")
            .sort({ createdAt: -1 });

          // Filter: Lấy TẤT CẢ orders đã accepted (cooking, ready, hoặc served chưa complete)
          const filteredReady = acceptedOrders.filter((order) => {
            if (order.items.length === 0) return false;

            // Loại bỏ orders đã hoàn thành (tất cả served VÀ order.status = 'served')
            const allServed = order.items.every(
              (item) => item.status === "served"
            );
            if (allServed && order.status === "served") return false;

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
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        })
        .populate("acceptedBy", "fullName email role")
        .populate("preparedBy", "fullName email role")
        .populate("servedBy", "fullName email role")
        .sort({ createdAt: -1 });

      res.status(200).json({ orders });
    } catch (err) {
      console.error("Error in getAllOrders:", err);
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

        // Update all items status to accepted
        order.items.forEach((item) => {
          item.status = "accepted";
        });

        await order.save();

        const fullOrder = await Order.findById(order._id)
          .populate({
            path: "sessionId",
            populate: { path: "tableId", select: "name" },
          })
          .populate("items.menuItemId", "prepTime name")
          .populate("acceptedBy", "fullName email role")
          .populate("preparedBy", "fullName email role")
          .populate("servedBy", "fullName email role");

        // 1. Format dữ liệu CHUẨN cho KITCHEN (Giống hệt API getIncomingOrders)
        const kitchenFormat = {
          id: fullOrder._id,
          table: fullOrder.sessionId?.tableId?.name || "Unknown",
          status: fullOrder.status,
          createdAt: fullOrder.createdAt,
          acceptedAt: fullOrder.acceptedAt,
          items: fullOrder.items.map((item) => ({
            itemId: item._id,
            name: item.name,
            qty: item.quantity, // Kitchen UI dùng 'qty', DB dùng 'quantity' -> Phải map lại
            note: item.note,
            modifiers: item.modifiers,
            status: item.status,
            prepTime: item.menuItemId?.prepTime || 15,
          })),
        };

        // Ở đây Waiter/Customer dùng cấu trúc gốc nên gửi fullOrder
        const standardFormat = fullOrder.toObject();

        // Emit với data đã format
        io.to(`restaurant_${restaurantId}_kitchen`).emit(
          "kitchen:order_update",
          kitchenFormat
        );
        io.to(`restaurant_${restaurantId}_waiter`).emit(
          "order_accepted",
          standardFormat
        );
        io.to(`restaurant_${restaurantId}_admin`).emit(
          "order_accepted",
          standardFormat
        );
        io.to(`session_${sessionId}`).emit("order_update", standardFormat);

        // Cập nhật tổng tiền session
        const OrderSession = (await import("../models/OrderSession.mjs"))
          .default;
        const orderTotal = order.items.reduce((sum, item) => {
          const modifiersPrice =
            item.modifiers?.reduce((acc, mod) => acc + (mod.price || 0), 0) ||
            0;
          return sum + (item.price + modifiersPrice) * item.quantity;
        }, 0);

        await OrderSession.findByIdAndUpdate(sessionId, {
          $inc: { totalAmount: orderTotal },
        });

        return res
          .status(200)
          .json({ message: "Order accepted", order: standardFormat });
      } else {
        // Rejected
        order.status = "rejected";
        order.rejectionReason = rejectionReason || "No reason provided";
        await order.save();

        const populatedOrder = await Order.findById(order._id)
          .populate({
            path: "sessionId",
            populate: { path: "tableId", select: "name" },
          })
          .populate("acceptedBy", "fullName email role")
          .populate("preparedBy", "fullName email role")
          .populate("servedBy", "fullName email role");

        io.to(`restaurant_${restaurantId}_waiter`).emit(
          "order_rejected",
          populatedOrder
        );
        io.to(`restaurant_${restaurantId}_admin`).emit(
          "order_rejected",
          populatedOrder
        );
        io.to(`session_${sessionId}`).emit("order_update", populatedOrder);

        res
          .status(200)
          .json({ message: "Order rejected", order: populatedOrder });
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
        .populate("acceptedBy", "fullName email role")
        .populate("preparedBy", "fullName email role")
        .populate("servedBy", "fullName email role");
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Chỉ update items có status = 'ready' thành 'served'
      order.items.forEach((item) => {
        if (item.status === "ready") {
          item.status = "served";
        }
      });

      order.servedBy = req.user.id;

      await order.save();

      // Populate lại đầy đủ sau khi save
      await order.populate([
        {
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        },
        { path: "acceptedBy", select: "fullName email" },
        { path: "preparedBy", select: "fullName email" },
        { path: "servedBy", select: "fullName email" },
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
        .populate("acceptedBy", "fullName email role")
        .populate("preparedBy", "fullName email role")
        .populate("servedBy", "fullName email role");
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
      order.servedAt = new Date();
      await order.save();

      // Populate lại đầy đủ sau khi save
      await order.populate([
        {
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        },
        { path: "acceptedBy", select: "fullName email" },
        { path: "preparedBy", select: "fullName email" },
        { path: "servedBy", select: "fullName email" },
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

      const sessions = await OrderSession.find({
        restaurantId,
        status: { $in: ["active", "payment_requested"] },
      })
        .populate("tableId", "name location")
        .sort({ startTime: -1 });

      // ⭐ ĐẢM BẢO TRẢ VỀ paymentStatus và paymentMethod
      const formattedSessions = await Promise.all(sessions.map(async (session) => {
        // Tính orderStats cho mỗi session
        const orders = await Order.find({ sessionId: session._id, status: { $ne: 'rejected' } });
        
        const orderStats = {
          totalOrders: orders.length,
          pending: 0,
          accepted: 0,
          ready: 0,
          served: 0
        };

        orders.forEach(order => {
          order.items.forEach(item => {
            if (item.status === 'pending') orderStats.pending++;
            else if (item.status === 'accepted') orderStats.accepted++;
            else if (item.status === 'ready') orderStats.ready++;
            else if (item.status === 'served') orderStats.served++;
          });
        });

        return {
          _id: session._id,
          tableId: session.tableId,
          startTime: session.startTime,
          totalAmount: session.totalAmount,
          discountPercentage: session.discountPercentage,
          discountAmount: session.discountAmount,
          finalAmount: session.finalAmount,
          status: session.status,
          paymentMethod: session.paymentMethod,
          paymentStatus: session.paymentStatus, // ⭐ QUAN TRỌNG
          orderStats: orderStats
        };
      }));

      res.status(200).json({ sessions: formattedSessions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [POST] /api/waiter/checkout/:sessionId
  // Xác nhận thanh toán (Dùng cho Tiền mặt)
  // Cấm con AI nào đụng vào hàm này
  async confirmPayment(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await OrderSession.findById(sessionId).populate(
        "restaurantId"
      );
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Cho phép clear nếu:
      // 1. Đã thanh toán (paymentStatus = 'paid') -> Bất kể session.status là gì
      // 2. Hoặc đang yêu cầu thanh toán tiền mặt (paymentMethod = 'cash' && status = 'payment_requested')

      const isPaid = session.paymentStatus === "paid";
      const isCashRequest =
        session.paymentMethod === "cash" &&
        session.status === "payment_requested";

      if (!isPaid && !isCashRequest) {
        return res.status(400).json({
          message:
            "Invalid payment status. Session must be PAID or requesting CASH.",
        });
      }

      // 1. Cập nhật session
      session.paymentStatus = "paid";
      session.status = "completed";
      session.endTime = new Date();
      await session.save();

      // Cập nhật doanh thu nhà hàng (Nếu trước đó chưa thanh toán)
      if (!isPaid && session.finalAmount && session.finalAmount > 0) {
        await Restaurant.findByIdAndUpdate(session.restaurantId._id, {
          $inc: { totalRevenue: session.finalAmount },
        });
      }

      // 2. Cập nhật bàn (ĐÓNG BÀN)
      await Table.findByIdAndUpdate(session.tableId, {
        status: "free",
        currentSessionId: null,
      });

      // 3. Emit socket tới Customer
      const io = req.app.get("socketio");
      io.to(`session_${sessionId}`).emit("session_ended", {
        sessionId,
        reason: "payment_completed",
        message: "Payment confirmed. Thank you!",
        method: session.paymentMethod,
      });

      // io.to(`restaurant_${restaurantId}_waiter`).emit("table_update");

      // 4. Thông báo tới các Waiter khác (optional)
      const table = await Table.findById(session.tableId);
      const restaurantId = session.restaurantId._id.toString();

      io.to(`restaurant_${restaurantId}_waiter`).emit("table_cleared", {
        sessionId,
        tableId: session.tableId,
        tableName: table.name,
        totalAmount: session.totalAmount,
        paymentMethod: session.paymentMethod,
      });

      // io.to(`restaurant_${restaurantId}_admin`).emit('payment_completed', {
      //     tableId: session.tableId,
      //     tableName: table.name,
      //     sessionId,
      //     totalAmount: session.totalAmount,
      //     paymentMethod: 'cash'
      // });

      res.status(200).json({
        message: "Cash payment confirmed successfully",
        session,
      });
    } catch (err) {
      console.error("Confirm Payment Error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/waiter/session/:sessionId/bill
  // Download bill PDF for a session
  async downloadBill(req, res) {
    try {
      const { sessionId } = req.params;

      // Lấy session data với đầy đủ populate
      const session = await OrderSession.findById(sessionId)
        .populate("restaurantId")
        .populate("tableId", "name location")
        .populate("customerId", "fullName email");

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Lấy tất cả orders (loại bỏ rejected)
      const orders = await Order.find({
        sessionId,
        status: { $ne: "rejected" },
      })
        .populate("servedBy", "fullName")
        .sort({ createdAt: 1 });

      // Add metadata to headers for frontend to use
      res.setHeader(
        "X-Restaurant-Name",
        session.restaurantId?.name || "Restaurant"
      );
      res.setHeader("X-Table-Name", session.tableId?.name || "Table");
      res.setHeader(
        "X-Session-Date",
        (session.endTime || new Date()).toISOString()
      );

      // Generate PDF
      generateBillPDF(res, session, orders);
    } catch (err) {
      console.error("Download Bill Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default new WaiterController();
