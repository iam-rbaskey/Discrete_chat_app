
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Chat from '@/app/lib/models/Chat';
import User from '@/app/lib/models/User';
import mongoose from 'mongoose';

// Ensure User model is registered before Chat
// This is important for population of participants
if (!mongoose.models.User) {
    try {
        mongoose.model('User', User.schema);
    } catch (e) {
        console.log("User model already loaded");
    }
}


export async function POST(req: Request) {
    try {
        const { currentUserId, targetUserId } = await req.json();

        if (!currentUserId || !targetUserId) {
            return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            participants: { $all: [currentUserId, targetUserId] }
        }).populate('participants', 'name avatar uniqueId status gender country');

        if (existingChat) {
            return NextResponse.json({ chat: existingChat, isNew: false });
        }

        // Create new chat
        const newChat = await Chat.create({
            participants: [currentUserId, targetUserId],
            initiator: currentUserId,
            status: 'pending',
            lastMessage: 'Chat initialized',
            lastMessageAt: new Date()
        });

        // Populate participants for frontend
        const populatedChat = await Chat.findById(newChat._id)
            .populate('participants', 'name avatar uniqueId status gender country');

        return NextResponse.json({ chat: populatedChat, isNew: true });
    } catch (error: any) {
        console.error('Create chat error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        await connectToDatabase();

        const chats = await Chat.find({
            participants: userId
        })
            .populate('participants', 'name avatar uniqueId status gender country')
            .sort({ updatedAt: -1 });

        return NextResponse.json({ chats });

    } catch (error: any) {
        console.error('Get chats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
