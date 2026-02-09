
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';

export async function GET() {
    try {
        const db = await connectToDatabase();
        return NextResponse.json({
            status: 'Access Granted',
            message: 'Successfully connected to MongoDB Cluster0',
            connectionState: db.connection.readyState
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'Access Denied',
            error: error.message
        }, { status: 500 });
    }
}
