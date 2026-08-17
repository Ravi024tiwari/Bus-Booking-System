import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlist extends Document {
  passengerId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  passengerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  tripId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true,
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound unique index so a user cannot wishlist the same trip more than once
WishlistSchema.index({ passengerId: 1, tripId: 1 }, { unique: true });

export const Wishlist: Model<IWishlist> = mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
