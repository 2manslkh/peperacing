import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  lastCheckIn: Date;
  streak: number;
}

const userSchema = new mongoose.Schema({
  walletAddress: String,
  lastCheckIn: Date,
  streak: Number,
});

export default mongoose.model<IUser>("User", userSchema);
