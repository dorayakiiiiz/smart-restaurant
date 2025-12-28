import Table from "../models/Table.mjs";
import OrderSession from "../models/OrderSession.mjs";
import Order from "../models/Order.mjs";
import MenuItem from "../models/MenuItem.mjs";

class OrderController {
  // [POST] /api/orders/session/start
  // Body: { tableToken }
  // Logic: Quét QR -> Gọi API này
  async startSession(req, res) {
    try {
      const { tableToken } = req.body;

      // khi quét lần đầu -> gửi lên table token -> tạo session lưu vào db -> cập nhật
      // currentsessionid của table và gửi session về fe
      // -> lưu vào local -> mỗi req sau gửi kèm session lên để check từ local

      // 1. Tìm bàn từ Token
      const table = await Table.findOne({ token: tableToken }).populate(
        "restaurantId"
      );
      if (!table) return res.status(404).json({ message: "Invalid QR Code" });

      let session;

      // 2. Nếu bàn đang có khách -> Join session cũ
      if (table.status === "occupied" && table.currentSessionId) {
        session = await OrderSession.findById(table.currentSessionId)
          .populate("tableId") // Populate để lấy tên bàn
          .populate("restaurantId");
      }

      // 3. Nếu chưa có -> Tạo session mới
      if (!session || session.status !== "active") {
        session = await OrderSession.create({
          restaurantId: table.restaurantId._id,
          tableId: table._id,
          tableToken: tableToken,
          customerId: req.user ? req.user.id : null,
          status: "active",
        });

        // Cập nhật trạng thái bàn
        table.status = "occupied";
        table.currentSessionId = session._id;
        await table.save();

        // Populate lại để Frontend có tên bàn hiển thị
        session = await session.populate("tableId");
        session = await session.populate("restaurantId");
      }

      res.status(200).json({
        message: "Session active",
        session,
        restaurant: table.restaurantId,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [POST] /api/orders
  // Body: { sessionId, items: [{ menuItemId, quantity, modifiers, note }] }
  async placeOrder(req, res) {
    try {
      const { sessionId, items, customerNote } = req.body;

      const session = await OrderSession.findById(sessionId);
      if (!session || session.status !== "active") {
        return res
          .status(400)
          .json({ message: "Session is not active or closed." });
      }

      // 1. Tính toán giá tiền server-side
      let orderItems = [];
      let currentOrderTotal = 0;

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) continue;

        let itemPrice = menuItem.price;
        let modifiersTotal = 0;

        // Logic tính tiền modifier đơn giản
        if (item.modifiers && Array.isArray(item.modifiers)) {
          item.modifiers.forEach((mod) => {
            modifiersTotal += mod.price || 0;
          });
        }

        const finalItemPrice = itemPrice + modifiersTotal;
        currentOrderTotal += finalItemPrice * item.quantity;

        orderItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: finalItemPrice,
          quantity: item.quantity,
          modifiers: item.modifiers || [],
          note: item.note || "",
          status: "pending",
        });
      }

      if (orderItems.length === 0) {
        return res.status(400).json({ message: "No valid items in order" });
      }

      // 2. Tạo Order con
      const newOrder = await Order.create({
        restaurantId: session.restaurantId,
        sessionId: session._id,
        orderedBy: req.user ? req.user.id : null, // Nếu guest thì null
        items: orderItems,
        status: "pending",
        note: customerNote,
      });

      // Populate đầy đủ để emit cho waiter
      const populatedOrder = await Order.findById(newOrder._id).populate({
        path: "sessionId",
        populate: { path: "tableId", select: "name" },
      });

      // 3. KHÔNG cộng tiền ngay, chỉ cộng khi waiter accept

      // 4. REAL-TIME SOCKET EMIT
      const io = req.app.get("socketio");
      const restaurantId = session.restaurantId.toString();
      // Gửi cho WAITER để duyệt
      io.to(`restaurant_${restaurantId}_waiter`).emit(
        "new_order_alert",
        populatedOrder
      );

      // Báo cho Customer cùng bàn (Room: session_ID)
      io.to(`session_${sessionId}`).emit("order_update", populatedOrder);

      res
        .status(201)
        .json({ message: "Order placed successfully", order: populatedOrder });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/orders/session/:sessionId
  // Lấy lịch sử gọi món của bàn (để hiển thị tab "Đã gọi")
  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await OrderSession.findById(sessionId)
        .populate("tableId", "name")
        .populate("restaurantId", "name currency");

      if (!session)
        return res.status(404).json({ message: "Session not found" });

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
      if (!session)
        return res.status(404).json({ message: "Session not found" });

      session.status = "payment_requested";
      session.paymentMethod = paymentMethod;
      await session.save();

      // Socket báo Waiter
      const io = req.app.get("socketio");
      io.to(`restaurant_${session.restaurantId}_waiter`).emit(
        "payment_request",
        {
          sessionId: session._id,
          tableId: session.tableId,
          method: paymentMethod,
        }
      );

      res.status(200).json({ message: "Bill requested", session });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new OrderController();
