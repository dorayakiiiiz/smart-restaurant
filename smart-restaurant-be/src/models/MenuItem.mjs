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
    images: [{
        url: { type: String, required: true },
        publicId: { type: String }, // Dùng để xóa ảnh trên Cloudinary
        isPrimary: { type: Boolean, default: false }
    }],
    
    // Thời gian chuẩn bị (phút) - dùng cho KDS cảnh báo
    prepTime: { type: Number, default: 15 }, 
    
    // Tùy chọn: Size, Topping...
    modifiers: [{
        name: { type: String, required: true }, // Tên nhóm (VD: Size, Topping)
        selectionType: { 
            type: String, 
            enum: ['single', 'multiple'], // Ví dụ như size thì single, topping thì multiple
            default: 'single' 
        },
        isRequired: { type: Boolean, default: false },
        minSelections: { type: Number, default: 0 },
        maxSelections: { type: Number }, // Optional
        displayOrder: { type: Number, default: 0 },
        
        options: [{
            name: { type: String, required: true }, // Tên option (VD: Small, Extra Cheese)
            priceAdjustment: { type: Number, default: 0 },
            isDefault: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true } // Status
        }]
    }],

    isAvailable: { type: Boolean, default: true }, // Còn hàng/Hết hàng
    isSoldOut: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isChefRecommended : { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { timestamps: true,
    toJSON: { virtuals: true }, // Cho phép hiển thị virtuals khi convert sang JSON
    toObject: { virtuals: true }
 });


export default mongoose.model("MenuItem", MenuItemSchema);