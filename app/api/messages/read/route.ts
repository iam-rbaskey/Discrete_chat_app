
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Message from '@/app/lib/models/Message';
import Chat from '@/app/lib/models/Chat';

import mongoose from 'mongoose';

// Mark messages as read for a chat
export async function PUT(req: Request) {
    try {
        const { chatId, userId } = await req.json();

        if (!chatId || !userId || !mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: 'Invalid or missing IDs' }, { status: 400 });
        }

        await connectToDatabase();

        // Update messages sent by OTHER people in this chat to isRead: true
        // We want to mark messages *received* by userId as read.
        // So we update messages where chatId == chatId AND senderId != userId

        await Message.updateMany(
            { chatId, senderId: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );

        // Optionally update the Chat model to reflect unread count if we were tracking it there
        // For now, calculating unread count on fly is better or tracking in Chat.participants status

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Mark read error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
