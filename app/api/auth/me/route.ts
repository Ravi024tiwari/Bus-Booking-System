import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User } from '@/models';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';

    let userId: string | null = null;
    let shouldMintToken = false;

    // 1. Decode & Verify Custom JWT Token (if present)
    if (token) {
      try {
        const decoded: any = jwt.verify(token, jwtSecret);
        userId = decoded.id;
      } catch (jwtErr) {
        // Fall through to check Better-Auth session
      }
    }

    // 2. Check for Better-Auth Google Session
    let sessionUser: any = null;
    if (!userId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session) {
        userId = session.user.id;
        sessionUser = session.user;
        shouldMintToken = true;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const cacheKey = `user:profile:${userId}`;

    // 3. Try fetching cached user profile from Redis (if no immediate OAuth sync required)
    if (!sessionUser) {
      try {
        const cachedProfile = await redis.get(cacheKey);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          return NextResponse.json({
            success: true,
            data: parsed
          });
        }
      } catch (redisErr) {
        console.warn('[Me API] Redis fetch error (falling back to database):', redisErr);
      }
    }

    // 4. Fetch User Profile from MongoDB
    let user = await User.findById(userId).select('-password');
    if (!user && sessionUser?.email) {
      user = await User.findOne({ email: sessionUser.email }).select('-password');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User profile not found.' },
        { status: 401 }
      );
    }

    // Synchronize Google Avatar to profileImage if missing
    const googlePhoto = sessionUser?.image || (user as any).image || null;
    if (googlePhoto && (!user.profileImage || user.profileImage !== googlePhoto)) {
      user.profileImage = googlePhoto;
      user.image = googlePhoto;
      await user.save();
    }

    const resolvedAvatar = user.profileImage || googlePhoto || null;

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender || null,
      age: user.age || null,
      profileImage: resolvedAvatar,
      image: resolvedAvatar,
      avatar: resolvedAvatar,
      phoneNumber: user.phoneNumber || null,
      emergencyContactName: user.emergencyContactName || null,
      emergencyContactPhone: user.emergencyContactPhone || null
    };

    // 5. Save to Redis with 1-hour Expiry
    try {
      await redis.set(cacheKey, JSON.stringify(userData), 'EX', 3600);
    } catch (redisErr) {
      console.warn('[Me API] Redis set error:', redisErr);
    }

    const response = NextResponse.json({
      success: true,
      data: userData
    });

    if (shouldMintToken) {
      const newToken = jwt.sign(
        { id: userData.id, email: userData.email, role: userData.role, name: userData.name },
        jwtSecret,
        { expiresIn: '7d' }
      );
      response.cookies.set({
        name: 'token',
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      });
    }

    return response;

  } catch (err: any) {
    console.error('[Me API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching profile.' },
      { status: 500 }
    );
  }
}
