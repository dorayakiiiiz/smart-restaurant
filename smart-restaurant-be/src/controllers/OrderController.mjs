import Table from "../models/Table.mjs";
import Order from "../models/Order.mjs";
import OrderSession from "../models/OrderSession.mjs";
import MenuItem from "../models/MenuItem.mjs";
import mongoose from "mongoose";
// import payos from "../config/payos.mjs"; // KHÔNG DÙNG GLOBAL NỮA
import { PayOS } from "@payos/node"; // Import Class PayOS
import { decrypt } from "../utils/crypto.mjs"; // Import giải mã

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

      const populatedOrder = await Order.findById(newOrder._id)
        .populate({
          path: "sessionId",
          populate: { path: "tableId", select: "name" },
        })
        .populate('acceptedBy', 'fullName email role')
        .populate('preparedBy', 'fullName email role')
        .populate('servedBy', 'fullName email role');

      const io = req.app.get("socketio");
      const restaurantId = session.restaurantId.toString();
      
      const orderData = populatedOrder.toObject();
      
      io.to(`restaurant_${restaurantId}_waiter`).emit(
        "new_order_alert",
        orderData
      );
      io.to(`restaurant_${restaurantId}_admin`).emit(
        "new_order_alert",
        orderData
      );
      io.to(`restaurant_${restaurantId}_kitchen`).emit(
        "new_order_alert",
        orderData
      );

      io.to(`session_${sessionId}`).emit("order_update", orderData);

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
    async requestCheckout(req, res) {
        try {
            const { sessionId } = req.params;
            const { paymentMethod } = req.body; // 'cash' | 'transfer'

            // Populate restaurantId để lấy config PayOS
            const session = await OrderSession.findById(sessionId)
                .populate('restaurantId') 
                .populate('tableId', 'name');
            
            if (!session) return res.status(404).json({ message: "Session not found" });

            // Tính lại tổng tiền lần cuối để chắc chắn
            const orders = await Order.find({ sessionId: sessionId, status: { $ne: 'rejected' } });
            const totalAmount = orders.reduce((acc, order) => {
                return acc + order.items.reduce((iAcc, item) => {
                    const modPrice = item.modifiers.reduce((mAcc, mod) => mAcc + mod.price, 0);
                    return iAcc + (item.price + modPrice) * item.quantity;
                }, 0);
            }, 0);

            session.totalAmount = totalAmount;
            session.paymentMethod = paymentMethod;
            session.status = 'payment_requested';
            
            // Socket setup
            const io = req.app.get("socketio");
            const restaurantId = session.restaurantId._id.toString();

            if (paymentMethod === 'cash') {
                // ...existing code...
                await session.save();
                io.to(`restaurant_${restaurantId}_waiter`).emit("payment_requested", {
                    sessionId,
                    tableId: session.tableId,
                    method: 'cash',
                    amount: totalAmount
                });
                return res.json({ message: "Cash payment requested", method: 'cash' });
            } 
            else if (paymentMethod === 'transfer') {
                // 1. Lấy Config PayOS của nhà hàng
                const restaurant = session.restaurantId;
                if (!restaurant.payosConfig || !restaurant.payosConfig.isConfigured) {
                    return res.status(400).json({ message: "Online payment is not configured for this restaurant." });
                }

                // 2. Giải mã credentials
                const clientId = decrypt(restaurant.payosConfig.clientId);
                const apiKey = decrypt(restaurant.payosConfig.apiKey);
                const checksumKey = decrypt(restaurant.payosConfig.checksumKey);

                // 3. Khởi tạo PayOS Instance riêng cho request này
                const customPayOS = new PayOS({ clientId, apiKey, checksumKey });

                // Tạo mã đơn hàng
                const orderCode = Number(String(Date.now()).slice(-9));
                session.orderCode = orderCode;
                await session.save();

                const tableName = session.tableId?.name || `Table-${session.tableId}`;
                const description = `Ban ${tableName}`.substring(0, 25);

                // Tạo link thanh toán PayOS

                const amount = Math.round(totalAmount * 1000);

                const paymentData = {
                    orderCode: orderCode,
                    amount: amount,
                    description: description,
                    cancelUrl: `${process.env.CLIENT_URL}/menu`,
                    returnUrl: `${process.env.CLIENT_URL}/payment/success?session_id=${sessionId}`,
                };

                console.log("Creating PayOS link with data:", paymentData);

                const paymentLinkRes = await customPayOS.paymentRequests.create(paymentData);

                console.log("PayOS response:", paymentLinkRes);

                const checkoutUrl = paymentLinkRes.checkoutUrl;

                if (!checkoutUrl) {
                    throw new Error("PayOS did not return checkoutUrl");
                }

                // Báo cho Waiter biết khách đang thanh toán online
                io.to(`restaurant_${restaurantId}_waiter`).emit("payment_requested", {
                    sessionId,
                    tableId: session.tableId,
                    method: 'transfer',
                    amount: totalAmount
                });

                return res.json({ 
                    message: "Payment link created", 
                    method: 'transfer',
                    checkoutUrl: checkoutUrl 
                });
            }

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }

  // [POST] /api/orders/session/:sessionId/claim 
  // Gán session và các order ẩn danh trong session đó cho user đang login
  async claimSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // 1. Cập nhật Session: Gán customerId nếu chưa có
      await OrderSession.findByIdAndUpdate(sessionId, {
        customerId: userId,
      });

      // 2. Cập nhật các Order: Chỉ cập nhật các order chưa có người sở hữu (orderedBy: null)
      // thuộc session này thành của user này.
      await Order.updateMany(
        { sessionId: sessionId, orderedBy: null },
        { orderedBy: userId }
      );

      res.status(200).json({ message: "Session claimed successfully" });
    } catch (err) {
      console.error("Claim Session Error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // [POST] /api/orders/webhook/payos
    // Webhook nhận dữ liệu từ PayOS khi thanh toán thành công
    async handlePayOSWebhook(req, res) {
        try {
            console.log("📩 PayOS Webhook received:", req.body);
            
            // Dữ liệu webhook chưa verify
            const webhookDataRaw = req.body.data;
            const orderCode = webhookDataRaw.orderCode;

            // 1. Tìm Session trước để biết thuộc nhà hàng nào
            const session = await OrderSession.findOne({ orderCode })
                .populate('restaurantId')
                .populate('tableId', 'name');
            
            if (!session) {
                console.log(`⚠️ Session not found for orderCode: ${orderCode}`);
                return res.json({ success: false, message: "Session not found" });
            }

            // 2. Lấy Config PayOS của nhà hàng đó để verify
            const restaurant = session.restaurantId;
            if (!restaurant.payosConfig || !restaurant.payosConfig.isConfigured) {
                console.log("❌ Restaurant PayOS config missing");
                return res.json({ success: false });
            }

            const clientId = decrypt(restaurant.payosConfig.clientId);
            const apiKey = decrypt(restaurant.payosConfig.apiKey);
            const checksumKey = decrypt(restaurant.payosConfig.checksumKey);

            const customPayOS = new PayOS({ clientId, apiKey, checksumKey });

            // 3. Verify Webhook Data
            const webhookData = customPayOS.webhooks.verify(req.body);

            console.log("✅ Webhook verified:", webhookData);

            // Check thanh toán thành công
            if (webhookData.code === "00" && webhookData.success === true) {
                console.log(`💰 Payment SUCCESS for orderCode: ${orderCode}`);
                
                // ⭐ CHỈ CẬP NHẬT paymentStatus, KHÔNG đổi status session
                session.paymentStatus = 'paid';
                await session.save();

                const io = req.app.get("socketio");
                const restaurantId = restaurant._id.toString();
                const sessionId = session._id.toString();

                // 1. Báo cho Customer → Hiển thị Thank You screen NGAY
                io.to(`session_${sessionId}`).emit("session_ended", {
                    reason: 'payment_completed',
                    method: 'transfer'
                });

                // 2. Báo cho Waiter → Cập nhật UI bàn thành "QR Paid ✓"
                io.to(`restaurant_${restaurantId}_waiter`).emit("payment_success", {
                    sessionId,
                    tableId: session.tableId._id,
                    tableName: session.tableId.name,
                    method: 'transfer',
                    amount: session.totalAmount
                });
            } else {
                console.log(`❌ Payment failed or cancelled: code=${webhookData.code}`);
            }

            // LUÔN TRẢ VỀ 200 OK cho PayOS
            res.status(200).json({ success: true });

        } catch (err) {
            console.error("❌ Webhook Error:", err);
            // Vẫn trả 200 để PayOS không retry spam
            res.status(200).json({ success: false, error: err.message });
        }
    }

  // [GET] /api/orders/history
  // Lấy lịch sử đơn hàng của user đang login
  async getCustomerHistory(req, res) {
    try {
      const userId = req.user.id;

      const history = await Order.aggregate([
        // 1. Lọc các order của user này
        { $match: { orderedBy: new mongoose.Types.ObjectId(userId) } },

        // 2. Sắp xếp order theo thời gian tạo (để hiển thị đúng thứ tự gọi món)
        { $sort: { createdAt: 1 } },

        // 3. Group theo Session (Mỗi session là 1 lần đi ăn)
        {
          $group: {
            _id: "$sessionId",

            // Gom các order con vào mảng ordersList
            ordersList: {
              $push: {
                _id: "$_id",
                status: "$status",
                createdAt: "$createdAt",
                items: "$items" // Giữ nguyên cấu trúc items của từng lần order
              }
            }
          }
        },

        // 4. Lookup Session để lấy thông tin thanh toán & ngày giờ
        {
          $lookup: {
            from: "ordersessions",
            localField: "_id",
            foreignField: "_id",
            as: "sessionInfo"
          }
        },
        { $unwind: "$sessionInfo" },

        // 5. Sắp xếp Session mới nhất lên đầu
        { $sort: { "sessionInfo.startTime": -1 } },

        // 6. Project output
        {
          $project: {
            sessionId: "$_id",
            date: "$sessionInfo.startTime",
            paymentStatus: "$sessionInfo.paymentStatus",
            // Tổng tiền lấy từ session (Backend đã tính khi checkout)
            // Hoặc nếu muốn tính lại từ items thì dùng $reduce, nhưng lấy từ session cho chuẩn bill
            totalAmount: "$sessionInfo.totalAmount",
            ordersList: 1
          }
        }
      ]);

      res.status(200).json({ orders: history });
    } catch (err) {
      console.error("Get History Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default new OrderController();

