import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIdempotencyLog extends Document {
  key: string; // The unique webhook event ID (e.g. Razorpay event.id)
  processedAt: Date;
}

const IdempotencyLogSchema = new Schema<IIdempotencyLog>({
  key: { 
    type: String, 
    required: true, 
    unique: true, // Ensures double deliveries fail immediately
    index: true 
  },
  processedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// TTL INDEX: Automatically cleans up webhook logs after 7 days (7 * 24 * 60 * 60 seconds)
// Keeps the collections compact and performant.
IdempotencyLogSchema.index({ processedAt: 1 }, { expireAfterSeconds: 604800 });

export const IdempotencyLog: Model<IIdempotencyLog> = mongoose.models.IdempotencyLog || mongoose.model<IIdempotencyLog>('IdempotencyLog', IdempotencyLogSchema);
