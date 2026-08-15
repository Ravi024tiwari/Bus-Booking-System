import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStop {
  stopName: string;
  arrivalOffsetMinutes: number; // Minutes from journey start
  departureOffsetMinutes: number; // Minutes from journey start
  sequence: number; // Order of stop in route
}

export interface IRoute extends Document {
  operatorId: mongoose.Types.ObjectId;
  source: string;
  destination: string;
  stops: IStop[];
  createdAt: Date;
}

const StopSchema = new Schema<IStop>({
  stopName: { 
    type: String, 
    required: true 
  },
  arrivalOffsetMinutes: { 
    type: Number, 
    required: true 
  },
  departureOffsetMinutes: { 
    type: Number, 
    required: true 
  },
  sequence: { 
    type: Number, 
    required: true 
  }
});

const RouteSchema = new Schema<IRoute>({
  operatorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
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
  stops: [StopSchema],// one route have multiple stops

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index to quickly find route templates matching search terms
RouteSchema.index({ source: 1, destination: 1 });

export const Route: Model<IRoute> = mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);
