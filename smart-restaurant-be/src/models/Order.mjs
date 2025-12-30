import mongoose from "mongoose";
const { Schema } = mongoose;

//DB của 1 MÓN ĂN
const OrderItemSchema = new Schema({
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: String, // Lưu cứng tên món tại thời điểm đặt (phòng khi đổi tên)
    price: Number,
    quantity: { type: Number, required: true },

    modifiers: [{ // Lưu các tùy chọn khách chọn
        name: String,
        option: String,
        price: Number
    }],

    note: String, // Ghi chú: "Không hành", "Ít đá"

    //Status dành cho bếp
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'ready', 'served'],
        default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date } // Thời điểm món này được đánh dấu là ready
});

//DB của nguyên 1 order (gồm nhiều món ăn)
const OrderSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    
    // Link về Session cha
    sessionId: { type: Schema.Types.ObjectId, ref: "OrderSession", required: true },
    
    // Ai gọi lượt này? (Có thể bàn có nhiều người quét QR gọi)
    orderedBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    items: [OrderItemSchema],
    
    // Trạng thái duyệt của Waiter cho cả lượt gọi này
    status: {
        type: String,
        //Thêm để theo dõi toàn order, phải có thêm các trạng thái
        enum: ['pending', 'accepted', 'rejected', 'preparing', 'ready', 'served'], 
        default: 'pending'
    },

    acceptedAt: { type: Date }, // Thời điểm Waiter accept
    preparingAt: { type: Date }, // Thời điểm Kitchen accept (bắt đầu làm)
    readyAt: { type: Date },
    servedAt: { type: Date },
    
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
    preparedBy: { type: Schema.Types.ObjectId, ref: "User" },
    servedBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    rejectionReason: { type: String } // Nếu Waiter từ chối
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);