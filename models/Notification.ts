import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'BOOKING_CONFIRMED' | 'PAYMENT_FAILED' | 'TRIP_CANCELLED' | 'BUS_BOARDING' | 'GENERAL';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['BOOKING_CONFIRMED', 'PAYMENT_FAILED', 'TRIP_CANCELLED', 'BUS_BOARDING', 'GENERAL'], 
    default: 'GENERAL',
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false,
    required: true,
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// COMPOUND INDEX: Speeds up fetching unread notifications for a user, newest first
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// TTL INDEX: Automatically delete notifications after 30 days (30 * 24 * 60 * 60 seconds)
// This keeps user inboxes clean and database size optimized.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
