
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-12345';

const verifyAdmin = async (req: Request) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);

        await connectToDatabase();
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
    }

    try {
        const { id } = params;
        const { role, isSuspended, clearanceLevel } = await req.json();

        await connectToDatabase();

        const updateData: any = {};
        if (role) updateData.role = role;
        if (typeof isSuspended === 'boolean') updateData.isSuspended = isSuspended;
        if (clearanceLevel && clearanceLevel >= 1 && clearanceLevel <= 5) {
            updateData.clearanceLevel = clearanceLevel;
            // Sync legacy role: Level 5 = Admin, else User
            updateData.role = clearanceLevel === 5 ? 'admin' : 'user';
        }

        // 'new' is deprecated, use 'returnDocument: after'
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
    }

    try {
        const { id } = params;
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.notifications.push({ message, isRead: false, createdAt: new Date() } as any);
        await user.save();

        return NextResponse.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
