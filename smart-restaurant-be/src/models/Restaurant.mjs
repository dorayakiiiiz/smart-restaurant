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
    slug: { // Dùng cho URL thân thiện
        type: String,
        unique: true
    },
    logoUrl: { type: String },
    coverUrl: { type: String },
    bio: { type: String }, // Giới thiệu quán
    address: { type: String },
    wifiPassword: { type: String },
    currency: { type: String, default: 'VND' },
    
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
        // Flag để biết nhà hàng đã cấu hình chưa
        isConfigured: { type: Boolean, default: false },
        accountHolder: { type: String }
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Restaurant', RestaurantSchema);