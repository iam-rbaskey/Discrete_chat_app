
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

        /* 
           This is a critical security check. We verify
           1. Token is valid
           2. User exists in DB
           3. User has 'admin' role
        */
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

export async function GET(req: Request) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
    }

    try {
        await connectToDatabase();

        // Fetch all users but exclude sensitive data like password
        const users = await User.find({}, '-password -__v').sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
