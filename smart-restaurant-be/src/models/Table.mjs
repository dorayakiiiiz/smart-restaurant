import mongoose from "mongoose";
const { Schema } = mongoose;

const TableSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: { type: String, required: true }, // Bàn 1, Bàn 2, VIP 1...
    capacity: { type: Number, default: 4 }, // Số ghế
    
    // Token để sinh QR Code, đảm bảo bảo mật
    token: { type: String, required: true, unique: true },
    
    status: {
        type: String,
        enum: ['free', 'occupied', 'reserved'], // Trống, Có khách, Đã đặt
        default: 'free'
    },
    
    // Link tới Order hiện tại (nếu đang có khách)
    currentOrderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        default: null
    }
}, { timestamps: true });

export default mongoose.model('Table', TableSchema);