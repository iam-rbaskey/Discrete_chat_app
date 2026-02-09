
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';

export async function PUT(req: Request) {
    try {
        const { userId, status } = await req.json();

        if (!userId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['online', 'offline', 'busy'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true, select: 'name uniqueId status' }
        );

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error('Update status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
