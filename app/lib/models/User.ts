
import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    _id: string;
    name: string;
    email: string;
    password?: string;
    uniqueId: string; // 5-digit alphanumeric ID
    gender: string;
    country: string;
    avatar: string;
    status: 'online' | 'offline' | 'busy';
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    uniqueId: { type: String, required: true, unique: true, index: true },
    gender: { type: String, required: true },
    country: { type: String, required: true },
    avatar: { type: String, default: '' }, // No profile picture uploaded, will use initials
    status: { type: String, default: 'online' },
    createdAt: { type: Date, default: Date.now },
});

// Prevent model overwrite in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
