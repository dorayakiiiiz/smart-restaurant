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
    
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Restaurant', RestaurantSchema);