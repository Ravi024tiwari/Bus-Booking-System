import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, role } = await req.json();

    // 1. Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (role !== 'passenger' && role !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Invalid user role selected.' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email address is already in use.' },
        { status: 400 }
      );
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      operatorApprovalStatus: role === 'operator' ? 'PENDING' : 'APPROVED' // Operators require admin approval
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error('[Register API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
