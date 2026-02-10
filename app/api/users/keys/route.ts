
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';

export async function PUT(req: Request) {
    try {
        const { userId, publicKey } = await req.json();

        if (!userId || !publicKey) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { publicKey },
            { new: true }
        ).select('name uniqueId publicKey');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error('Update keys error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
