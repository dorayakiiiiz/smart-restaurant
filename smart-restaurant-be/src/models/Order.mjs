import mongoose from "mongoose";
const { Schema } = mongoose;

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
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
    },
    updatedAt: { type: Date, default: Date.now }
});

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
        enum: ['pending', 'accepted', 'rejected'], // Waiter duyệt -> accepted -> hiện lên KDS
        default: 'pending'
    },
    
    rejectionReason: { type: String } // Nếu Waiter từ chối
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);