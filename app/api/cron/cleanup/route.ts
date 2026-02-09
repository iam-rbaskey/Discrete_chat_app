
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Message from '@/app/lib/models/Message';

// This would typically be a cron job, but we can expose an API for a cron trigger
// or run it lazily when getting messages (not ideal for strict cleanup).
// For now, let's create an API endpoint that can be called by a cron-job service (like Vercel Cron).

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

        const result = await Message.deleteMany({
            createdAt: { $lt: threeHoursAgo }
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Cleanup executed. Deleted ${result.deletedCount} messages older than 3 hours.`
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
