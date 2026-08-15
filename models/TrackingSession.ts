import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrackingSession extends Document {
  tripId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

const TrackingSessionSchema = new Schema<ITrackingSession>({
  tripId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true,
    unique: true, // One tracking record per trip
    index: true 
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// TTL INDEX: Purge tracking data 24 hours (86400 seconds) after the journey ends/updates stop.
TrackingSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export const TrackingSession: Model<ITrackingSession> = mongoose.models.TrackingSession || mongoose.model<ITrackingSession>('TrackingSession', TrackingSessionSchema);
