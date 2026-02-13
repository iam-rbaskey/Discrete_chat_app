
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // 1. Set default role 'user' for those missing it
        const roleResult = await User.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'user' } }
        );

        // 2. Set default clearanceLevel 1 for those missing it (and not admin) - actually just set missing to 1
        // (Admins might be missing it if they were old admins, but we only have 1 admin we just made)
        // Only set if missing.
        const levelResult = await User.updateMany(
            { clearanceLevel: { $exists: false } },
            { $set: { clearanceLevel: 1 } }
        );

        // 3. Set other defaults
        const statsResult = await User.updateMany(
            { dataUsage: { $exists: false } },
            { $set: { dataUsage: 0 } }
        );

        const timeResult = await User.updateMany(
            { minutesActive: { $exists: false } },
            { $set: { minutesActive: 0 } }
        );

        const suspendResult = await User.updateMany(
            { isSuspended: { $exists: false } },
            { $set: { isSuspended: false } }
        );

        const notifResult = await User.updateMany(
            { notifications: { $exists: false } },
            { $set: { notifications: [] } }
        );

        // 4. Ensure any existing admin has level 5 if they don't already
        await User.updateMany(
            { role: 'admin', clearanceLevel: { $ne: 5 } },
            { $set: { clearanceLevel: 5 } }
        );

        return NextResponse.json({
            success: true,
            updates: {
                rolesSet: roleResult.modifiedCount,
                levelsSet: levelResult.modifiedCount,
                statsSet: statsResult.modifiedCount,
                timeSet: timeResult.modifiedCount,
                suspendSet: suspendResult.modifiedCount,
                notifSet: notifResult.modifiedCount
            },
            message: "Migration completed successfully."
        });

    } catch (error) {
        console.error("Migration failed", error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
