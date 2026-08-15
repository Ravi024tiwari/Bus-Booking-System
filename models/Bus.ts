import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBus extends Document {
  operatorId: mongoose.Types.ObjectId;
  busNumber: string;
  type: 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Non-AC Seater';
  capacity: number;
  rows: number;
  cols: number;
  sleeperSeats: string[]; // Seat numbers that render as sleeper berths (e.g. "L-1A", "U-1B")
  amenities: string[]; // E.g., ["WiFi", "AC", "Charging Port", "Blanket", "Water Bottle"]
  images: string[]; // Bus picture URLs
  createdAt: Date;
}

const BusSchema = new Schema<IBus>({
  operatorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Indexed to optimize operator dashboard loading
  },
  busNumber: { 
    type: String, 
    required: true,
    unique: true, // Bus license plate numbers must be unique
    index: true 
  },
  type: { 
    type: String, 
    enum: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater'], 
    required: true 
  },
  capacity: { 
    type: Number, 
    required: true 
  },
  rows: { 
    type: Number, 
    required: true 
  },
  cols: { 
    type: Number, 
    required: true 
  },
  sleeperSeats: [{ 
    type: String 
  }],
  amenities: [{ 
    type: String 
  }],
  images: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Bus: Model<IBus> = mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);
