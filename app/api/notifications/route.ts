import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Notification from '@/app/lib/models/Notification';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const notifications = await Notification.find({ active: true }).sort({ createdAt: -1 }).limit(20);
        return NextResponse.json({ notifications });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        await connectToDatabase();
        const notification = await Notification.create(body);
        return NextResponse.json({ notification });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
