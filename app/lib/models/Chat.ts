
import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    participants: mongoose.Types.ObjectId[];
    initiator: mongoose.Types.ObjectId;
    status: 'pending' | 'active' | 'rejected' | 'blocked';
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    initiator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'blocked'],
        default: 'pending'
    },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure unique chat between two participants
// This is tricky with array order, so we handle it in API logic usually, 
// or use a sorted compound index if order is enforced.
// For now, simpler to check existence in API.

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
