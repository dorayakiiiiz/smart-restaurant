import mongoose from "mongoose"
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: { 
        type: String, 
        // BỎ unique: true ở đây
        sparse: true 
    },
    fullName: {
        type: String,
        required: true,
    },
    password: { 
        type: String, 
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'waiter', 'kitchen', 'customer', 'guest'],
        default: 'customer',
        required: true
    },
    // Link tới nhà hàng nào
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    googleId: { type: String },
    loginMethod: {
        type: String,
        enum: ['local', 'google', 'guest'],
        default: 'local'
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// TẠO COMPOUND INDEX: Email + RestaurantId phải là duy nhất
// Nghĩa là: 1 email có thể tạo nhiều acc, miễn là khác restaurantId
UserSchema.index({ email: 1, restaurantId: 1 }, { unique: true, sparse: true });

export default mongoose.model('User', UserSchema);