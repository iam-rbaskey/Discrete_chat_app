
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

export async function GET(req: Request) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
    }

    try {
        await connectToDatabase();

        // Count users
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'online' });

        // Sum total data usage
        const totalData = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$dataUsage" } } }
        ]);

        // Sum total active time
        const totalTime = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$minutesActive" } } }
        ]);

        return NextResponse.json({
            stats: {
                totalUsers,
                activeStats: activeUsers,
                dataTransferredBytes: totalData[0]?.total || 0,
                totalMinutesActive: totalTime[0]?.total || 0
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
