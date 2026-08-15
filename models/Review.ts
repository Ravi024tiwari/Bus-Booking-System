import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  passengerId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5 stars
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  passengerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  busId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Bus', 
    required: true,
    index: true 
  },
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// UNIQUE CONSTRAINT: Enforces that a user can only review once per ticket purchase
ReviewSchema.index({ passengerId: 1, bookingId: 1 }, { unique: true });

// UI OPTIMIZATION INDEX: Speeds up querying reviews for a bus, sorting highest ratings first
ReviewSchema.index({ busId: 1, rating: -1 });

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
