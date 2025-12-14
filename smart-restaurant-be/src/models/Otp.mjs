import mongoose from 'mongoose';
const { Schema } = mongoose;

const OtpSchema = new Schema({
    email: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        expires: 300
    }
});

export default mongoose.model('Otp', OtpSchema);