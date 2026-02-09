
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const currentUserId = searchParams.get('currentUserId');

        if (!query) {
            return NextResponse.json({ users: [] });
        }

        await connectToDatabase();

        // Search for user by uniqueId (exact match preferred) or name (partial match)
        // Excluding the current user from results
        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Exclude current user
                {
                    $or: [
                        { uniqueId: { $regex: new RegExp(`^${query}$`, 'i') } }, // Exact match for ID (case-insensitive)
                        { name: { $regex: new RegExp(query, 'i') } } // Partial match for name
                    ]
                }
            ]
        }).select('name uniqueId avatar status gender country');

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
