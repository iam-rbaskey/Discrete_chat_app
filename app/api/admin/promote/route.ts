
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';

export async function POST(req: Request) {
    try {
        const { email, secret } = await req.json();

        // Simple protection to prevent abuse if this route is left active
        // User must provide this secret key to promote someone
        if (secret !== process.env.JWT_SECRET && secret !== 'admin-setup-123') {
            return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { role: 'admin', clearanceLevel: 5 } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `User ${user.name} (${user.email}) is now an ADMIN.`,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
