import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const cookieStore = await cookies();//here we get that cookies
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated.' },
        { status: 401 }
      );
    }

    // 1. Decode & Verify Token
    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const cacheKey = `user:profile:${userId}`;

    // 2. Try fetching cached user profile from Redis
    try {
      const cachedProfile = await redis.get(cacheKey);
      if (cachedProfile) {
        console.log(`[Me API] Cache hit for profile key: ${cacheKey}`);
        return NextResponse.json({
          success: true,
          data: JSON.parse(cachedProfile)
        });
      }
    } catch (redisErr) {
      console.warn('[Me API] Redis fetch error (falling back to database):', redisErr);
    }

    // 3. Cache Miss - Fetch User Profile from MongoDB
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User profile not found.' },
        { status: 401 }
      );
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender || null,
      age: user.age || null,
      profileImage: user.profileImage || null,
      phoneNumber: user.phoneNumber || null,
      emergencyContactName: user.emergencyContactName || null,
      emergencyContactPhone: user.emergencyContactPhone || null
    };

    // 4. Save to Redis with 1-hour Expiry
    try {
      await redis.set(cacheKey, JSON.stringify(userData), 'EX', 3600);
      console.log(`[Me API] Cached user profile for key: ${cacheKey}`);
    } catch (redisErr) {
      console.warn('[Me API] Redis set error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (err: any) {
    console.error('[Me API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching profile.' },
      { status: 500 }
    );
  }
}
