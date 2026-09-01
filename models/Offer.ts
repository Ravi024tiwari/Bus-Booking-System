import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOffer extends Document {
  operatorId: mongoose.Types.ObjectId;
  title: string;
  code: string;
  description?: string;
  discountPercentage: number;
  maxDiscountAmount?: number;
  offerLimit: number; // Max number of passenger seats eligible for this offer
  tripId?: mongoose.Types.ObjectId; // Dynamically assigned to a specific trip
  validFrom: Date;
  validTill: Date;
  isActive: boolean;
  badgeText?: string;
  bannerImage?: string;
  themeColor?: string;
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  operatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  maxDiscountAmount: {
    type: Number,
    default: 0
  },
  offerLimit: {
    type: Number,
    required: true,
    min: 1
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    default: null,
    index: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTill: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  badgeText: {
    type: String,
    default: 'SPECIAL OFFER'
  },
  bannerImage: {
    type: String,
    default: '/images/volvo.png'
  },
  themeColor: {
    type: String,
    default: 'from-violet-600 to-indigo-600'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Composite index to look up active operator offers
OfferSchema.index({ operatorId: 1, isActive: 1 });
OfferSchema.index({ tripId: 1, isActive: 1 });

export const Offer: Model<IOffer> = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);
