import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    // Thêm field type để phân biệt review món ăn hay nhà hàng
    reviewType: {
        type: String,
        enum: ['menu_item', 'restaurant'],
        required: true,
        default: 'menu_item'
    },
    // menuItemId chỉ cần khi reviewType = 'menu_item'
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: "MenuItem"
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
}, { timestamps: true });

// Index để tìm nhanh
ReviewSchema.index({ restaurantId: 1, menuItemId: 1 });
ReviewSchema.index({ restaurantId: 1, reviewType: 1 });

export default mongoose.model('Review', ReviewSchema);