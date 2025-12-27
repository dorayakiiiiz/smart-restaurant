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
    location: { type: String, default: 'Main Hall' }, // Khu vực: Indoor, Outdoor, VIP...
    description: { type: String },
    
    // Token JWT để sinh QR Code, đảm bảo bảo mật
    token: { type: String, required: true, unique: true },
    
    status: {
        type: String,
        enum: ['free', 'occupied', 'reserved'], // Trống, Có khách, Đã đặt
        default: 'free'
    },

    // Soft delete
    isActive: { type: Boolean, default: true },
    
    // Link tới Order session hiện tại (nếu đang có khách)
    currentSessionId: {
        type: Schema.Types.ObjectId,
        ref: "OrderSession",
        default: null
    }
}, { timestamps: true });

// Đảm bảo tên bàn là duy nhất trong 1 nhà hàng (khi chưa bị xóa)
TableSchema.index({ restaurantId: 1, name: 1, isActive: 1 }, { unique: true });

export default mongoose.model('Table', TableSchema);