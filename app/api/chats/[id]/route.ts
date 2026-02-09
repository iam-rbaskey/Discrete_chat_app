
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Chat from '@/app/lib/models/Chat';
import User from '@/app/lib/models/User';

if (!mongoose.models.User) {
    try {
        mongoose.model('User', User.schema);
    } catch (e) {
        console.log("User model already loaded");
    }
}
import mongoose from 'mongoose';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { status } = await req.json();
        const { id } = await params;
        await connectToDatabase();

        const updatedChat = await Chat.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: 'after' }
        ).populate('participants', 'name avatar uniqueId status gender country');

        if (!updatedChat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ chat: updatedChat });
    } catch (error: any) {
        return NextResponse.json({ error: 'Update chat error' }, { status: 500 });
    }
}
