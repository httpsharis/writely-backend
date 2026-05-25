import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  googleId: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    googleId: { type: String, required: true, unique: true },
    refreshToken: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);