import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrip extends Document {
  busId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  busNumber: string; // Denormalized for single-query search optimization
  busType: string; // Denormalized for single-query search optimization
  source: string; // Denormalized from Route
  destination: string; // Denormalized from Route
  date: string; // YYYY-MM-DD format for fast, timezone-safe queries
  departureTime: Date;
  arrivalTime: Date;
  fare: number;
  offerId?: mongoose.Types.ObjectId; // Ref to Offer
  offerPercentage?: number;
  offerLimit?: number;
  offerBookedCount?: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
  averageRating?: number; // Verified passenger average rating (0 to 5)
  totalReviews?: number; // Total count of verified passenger ratings
  createdAt: Date;
}

const TripSchema = new Schema<ITrip>({
  busId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Bus', 
    required: true 
  },
  routeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Route', 
    required: true,
    index: true 
  },
  busNumber: { 
    type: String, 
    required: true 
  },
  busType: { 
    type: String, 
    required: true 
  },
  source: { 
    type: String, 
    required: true,
    index: true 
  },
  destination: { 
    type: String, 
    required: true,
    index: true 
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  departureTime: { 
    type: Date, 
    required: true,
    index: true 
  },
  arrivalTime: { 
    type: Date, 
    required: true 
  },
  fare: { 
    type: Number, 
    required: true,
    index: true 
  },
  offerId: {
    type: Schema.Types.ObjectId,
    ref: 'Offer',
    default: null,
    index: true
  },
  offerPercentage: {
    type: Number,
    default: 0
  },
  offerLimit: {
    type: Number,
    default: 0
  },
  offerBookedCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  status: { 
    type: String, 
    enum: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED'], 
    default: 'SCHEDULED',
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// CRITICAL SEARCH INDEX: Optimizes queries searching for trip listings on specific dates
TripSchema.index({ source: 1, destination: 1, date: 1 });

// CONFLICT CONTROL INDEX: Prevents double-scheduling the same physical bus at the same time
TripSchema.index({ busId: 1, departureTime: 1 });

export const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
