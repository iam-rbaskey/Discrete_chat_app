
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
    role: 'user' | 'admin';
    dataUsage: number;
    minutesActive: number;
    isSuspended: boolean;
    notifications: {
        _id: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
    }[];
    clearanceLevel: number; // 1-5, 5 is Admin
    publicKey?: string;
    encryptedPrivateKey?: string;
    createdAt: Date;
}

const NotificationSchema = new Schema({
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    uniqueId: { type: String, required: true, unique: true, index: true },
    gender: { type: String, required: true },
    country: { type: String, required: true },
    avatar: { type: String, default: '' }, // No profile picture uploaded, will use initials
    status: { type: String, default: 'online' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    clearanceLevel: { type: Number, min: 1, max: 5, default: 1 }, // 1: User, 5: Admin
    dataUsage: { type: Number, default: 0 }, // Bytes transferred (including messages sent/received)
    minutesActive: { type: Number, default: 0 }, // Time spent active in the app (minutes)
    isSuspended: { type: Boolean, default: false },
    notifications: [NotificationSchema],
    publicKey: { type: String }, // For E2EE: Public RSA Key (PEM or JWK string)
    encryptedPrivateKey: { type: String, select: false }, // Optional: Encrypted Private Key for multi-device sync (future)
    createdAt: { type: Date, default: Date.now },
});

// Prevent model overwrite in development
if (mongoose.models.User) {
    delete mongoose.models.User;
}
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
