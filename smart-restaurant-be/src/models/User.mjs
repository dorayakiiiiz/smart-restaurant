import mongoose from "mongoose"
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: { 
        type: String, 
        unique: true,
        sparse: true // Cho phép null (dành cho guest hoặc nhân viên tạo bởi admin ko cần email ngay)
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
    // Link tới nhà hàng nào (dành cho nhân viên)
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    googleId: {
        type: String
    },
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

export default mongoose.model('User', UserSchema);