
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Message from '@/app/lib/models/Message';
import Chat from '@/app/lib/models/Chat';
import User from '@/app/lib/models/User';
import mongoose from 'mongoose';

// Ensure models are registered
if (!mongoose.models.User) mongoose.model('User', User.schema);
if (!mongoose.models.Chat) mongoose.model('Chat', Chat.schema);

export async function POST(req: Request) {
    try {
        const { chatId, senderId, content } = await req.json();

        if (!chatId || !senderId || !content || !mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(senderId)) {
            return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
        }

        await connectToDatabase();

        // Create the message
        const newMessage = await Message.create({
            chatId,
            senderId,
            content,
            isRead: false
        });

        // Update the chat with last message info
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: content,
            lastMessageAt: new Date()
        });

        return NextResponse.json({ message: newMessage });
    } catch (error: any) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return NextResponse.json({ error: 'Missing or invalid chat ID' }, { status: 400 });
        }

        await connectToDatabase();

        const messages = await Message.find({ chatId })
            .sort({ createdAt: 1 }); // Oldest first for chat history

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error('Get messages error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
