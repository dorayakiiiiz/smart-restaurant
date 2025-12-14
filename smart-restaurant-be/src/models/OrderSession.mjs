import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderSessionSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    
    // Khách hàng chủ trì phiên này (có thể là Guest hoặc Customer)
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    
    // Tổng tiền tạm tính của tất cả các Order con
    totalAmount: { type: Number, default: 0 },
    
    status: {
        type: String,
        enum: ['active', 'payment_requested', 'completed', 'cancelled'],
        default: 'active'
    },
    
    paymentMethod: { type: String, default: null }, // cash, momo, stripe...
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    }
}, { timestamps: true });

export default mongoose.model('OrderSession', OrderSessionSchema);