import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderSession', required: true }, // Để xác định người đánh giá
    customerName: { type: String, default: "Guest" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
}, { timestamps: true });

// Đảm bảo 1 session chỉ đánh giá 1 món 1 lần (Unique compound index)
reviewSchema.index({ menuItemId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);