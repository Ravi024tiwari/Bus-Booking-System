import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISeatState extends Document {
  tripId: mongoose.Types.ObjectId;
  seatNumber: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  fromSequence: number;
  toSequence: number;
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
  fromSequence: {
    type: Number,
    required: true
  },
  toSequence: {
    type: Number,
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

// Segment-aware index for checking overlapping seat bookings quickly
SeatStateSchema.index({ tripId: 1, seatNumber: 1, fromSequence: 1, toSequence: 1 });

// TTL Index: Automatically deletes expired seat holds once heldUntil timestamp is reached
SeatStateSchema.index({ heldUntil: 1 }, { expireAfterSeconds: 0 });

export const SeatState: Model<ISeatState> = mongoose.models.SeatState || mongoose.model<ISeatState>('SeatState', SeatStateSchema);
