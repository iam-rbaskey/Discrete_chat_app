
import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/lib/models/User';
import { generateUniqueId } from '@/app/lib/utils/idGenerator';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password, gender, country } = await req.json();

        if (!name || !email || !password || !gender || !country) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique ID
        let uniqueId = generateUniqueId();
        let isUnique = false;

        // Ensure uniqueness
        while (!isUnique) {
            const existingId = await User.findOne({ uniqueId });
            if (!existingId) {
                isUnique = true;
            } else {
                uniqueId = generateUniqueId();
            }
        }

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            uniqueId,
            gender,
            country,
            avatar: '', // No profile picture as requested
            status: 'online'
        });

        return NextResponse.json({
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                uniqueId: newUser.uniqueId,
                avatar: newUser.avatar,
            },
            message: 'User registered successfully'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
