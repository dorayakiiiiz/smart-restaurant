import mongoose from "mongoose"
const { Schema } = mongoose;

const RestaurantSchema = new Schema({
    adminId: { 
        type: Schema.Types.ObjectId, 
        ref: "User",
        required: true, 
    },
    name: { 
        type: String,
        required: true 
    },
    logoUrl: { type: String },
    coverUrl: { type: String },
    bio: { type: String }, 
    address: { type: String },
    wifiPassword: { type: String },
    currency: { 
        type: String, 
        enum: ['USD', 'VND'],
        default: 'USD' 
    },
    
    // Contact info
    contact: {
        phone: { type: String },
        email: { type: String }
    },
    
    // Thêm cấu hình PayOS (Lưu dạng object đã mã hóa hoặc plain text tùy logic controller, ở đây lưu object kết quả từ hàm encrypt)
    payosConfig: {
        clientId: { 
            iv: String,
            content: String
        },
        apiKey: { 
            iv: String,
            content: String
        },
        checksumKey: { 
            iv: String,
            content: String
        },
        isConfigured: { type: Boolean, default: false },
        accountHolder: { type: String }
    },

    // Rating fields
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    isActive: {
        type: Boolean,
        default: true
    },
    totalRevenue: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('Restaurant', RestaurantSchema);