import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  passengerId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  seatNumbers: string[];
  amount: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  passengerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  tripId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true,
    index: true 
  },
  seatNumbers: [{ 
    type: String, 
    required: true 
  }],
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'], 
    default: 'PENDING',
    required: true 
  },
  razorpayOrderId: { 
    type: String,
    unique: true, // Crucial for mapping webhook callbacks uniquely
    sparse: true // Allows multiple null values for unpaid orders
  },
  razorpayPaymentId: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// Compound index to optimize passenger dashboard lookups sorted from newest to oldest
OrderSchema.index({ passengerId: 1, createdAt: -1 });

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
