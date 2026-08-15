import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISeatState extends Document {
  tripId: mongoose.Types.ObjectId;
  seatNumber: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  heldBy?: mongoose.Types.ObjectId;
  heldUntil?: Date; // Lock expiration time (only populated when status is HELD)
  bookedBy?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId; // References the confirmed booking transaction
}

const SeatStateSchema = new Schema<ISeatState>({
  tripId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true 
  },
  seatNumber: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'HELD', 'BOOKED'], 
    default: 'AVAILABLE',
    required: true 
  },
  heldBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  heldUntil: { 
    type: Date 
  },
  bookedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  orderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order' 
  }
});

// CRITICAL UNIQUE CONSTRAINT: Prevents double holding or double booking of a seat on the same trip
SeatStateSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

export const SeatState: Model<ISeatState> = mongoose.models.SeatState || mongoose.model<ISeatState>('SeatState', SeatStateSchema);
