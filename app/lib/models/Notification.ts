import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    createdAt: Date;
    active: boolean;
}

const NotificationSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'alert', 'success'], default: 'info' },
    active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
