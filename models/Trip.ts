import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrip extends Document {
  busId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  busNumber: string; // Denormalized for single-query search optimization
  busType: string; // Denormalized for single-query search optimization
  source: string; // Denormalized from Route
  destination: string; // Denormalized from Route
  departureTime: Date;
  arrivalTime: Date;
  fare: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
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
TripSchema.index({ source: 1, destination: 1, departureTime: 1 });

// CONFLICT CONTROL INDEX: Prevents double-scheduling the same physical bus at the same time
TripSchema.index({ busId: 1, departureTime: 1 });

export const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
