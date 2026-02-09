
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Message from '@/app/lib/models/Message';
import Chat from '@/app/lib/models/Chat';

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: 'Missing chat ID' }, { status: 400 });
        }

        await connectToDatabase();

        // Delete all messages for this chat
        await Message.deleteMany({ chatId });

        // Update chat to show "Transmission Destroyed"
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: 'Transmission Destroyed',
            lastMessageAt: new Date()
        });

        return NextResponse.json({ success: true, message: 'Transmission destroyed' });
    } catch (error: any) {
        console.error('Destroy transmission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
