import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderSessionSchema = new Schema({
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    
    // Ai là người mở bàn này đầu tiên (có thể null nếu là Guest)
    customerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    
    // Token bàn dùng để verify session này thuộc về QR nào (bảo mật thêm)
    tableToken: { type: String },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    
    // Tổng tiền (Backend tự tính, không tin Frontend)
    totalAmount: { type: Number, default: 0 },
    
    status: {
        type: String,
        enum: ['active', 'payment_requested', 'completed', 'cancelled'],
        default: 'active'
    },
    
    paymentMethod: { type: String, default: null },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    }
}, { timestamps: true });

export default mongoose.model('OrderSession', OrderSessionSchema);