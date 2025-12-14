import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: { type: String, required: true },
    image: { type: String },
    order: { type: Number, default: 0 }, 
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);