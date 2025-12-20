import mongoose from "mongoose";
const { Schema } = mongoose;

const MenuItemSchema = new Schema({
    //Thuộc nhà hàng nào
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    //Thuộc danh mục nào
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    
    // Thời gian chuẩn bị (phút) - dùng cho KDS cảnh báo
    prepTime: { type: Number, default: 15 }, 
    
    // Tùy chọn: Size, Topping...
    modifiers: [{
        name: String, // Ví dụ: "Size", "Độ ngọt"
        isRequired: { type: Boolean, default: false },
        options: [{
            name: String, // "Lớn", "Vừa"
            priceAdjustment: Number, // +5000
            isDefault: Boolean
        }]
    }],

    isAvailable: { type: Boolean, default: true }, // Còn hàng/Hết hàng
    isSoldOut: { type: Boolean, default: false },
    
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("MenuItem", MenuItemSchema);