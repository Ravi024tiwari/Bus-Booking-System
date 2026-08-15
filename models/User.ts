import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'passenger' | 'operator' | 'admin';
  operatorApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  gender?: 'male' | 'female' | 'other';
  age?: number;
  profileImage?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  password: { type: String },
  role: { 
    type: String, 
    enum: ['passenger', 'operator', 'admin'], 
    default: 'passenger' 
  },
  operatorApprovalStatus: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    // Operators default to PENDING; passengers/admins do not need approval
    required: function(this: any) { return this.role === 'operator'; }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number
  },
  profileImage: {
    type: String
  },
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
