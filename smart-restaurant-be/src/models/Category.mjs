import mongoose from "mongoose";
const { Schema } = mongoose;

// Dùng để lưu thông tin danh mục món ăn trong nhà hàng
//Như "Appetizers", "Main Courses", "Desserts", "Beverages"
const CategorySchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: { type: String, required: true },
    image: { type: String },
    //Thứ tự hiển thị trong menu
    order: { type: Number, default: 0 }, 
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);