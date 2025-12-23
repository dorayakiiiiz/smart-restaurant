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
    name: { 
        type: String, 
        required: true,
        minlength: 2,
        maxlength: 50
    },
    description: { type: String },
    //Thứ tự hiển thị trong menu
    order: { type: Number, default: 0 }, 
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure name is unique per restaurant
CategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', CategorySchema);