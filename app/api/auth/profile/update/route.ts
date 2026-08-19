import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User } from '@/models';
import { updateProfileSchema } from '@/lib/validations';
import { uploadToCloudinary } from '@/lib/cloudinary';
import bcrypt from 'bcryptjs';

/**
 * Handles user profile updates including optional profile image upload to Cloudinary.
 * Invalidates user profile Redis cache on successful update.
 */
export async function PUT(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to update profile.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET!;

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    const formData = await req.formData();
    const name = formData.get('name')?.toString() || undefined;
    const gender = formData.get('gender')?.toString() || undefined;
    const age = formData.get('age')?.toString() || undefined;
    const phoneNumber = formData.get('phoneNumber')?.toString() || undefined;
    const emergencyContactName = formData.get('emergencyContactName')?.toString() || undefined;
    const emergencyContactPhone = formData.get('emergencyContactPhone')?.toString() || undefined;
    const currentPassword = formData.get('currentPassword')?.toString() || undefined;
    const newPassword = formData.get('newPassword')?.toString() || undefined;

    // Validate using Zod
    const validationResult = updateProfileSchema.safeParse({ 
      name, gender, age, phoneNumber, emergencyContactName, emergencyContactPhone, currentPassword, newPassword 
    });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    // Build DB updates object
    const updateData: any = {};
    if (validationResult.data.name !== undefined) updateData.name = validationResult.data.name;
    if (validationResult.data.gender !== undefined) updateData.gender = validationResult.data.gender;
    if (validationResult.data.age !== undefined) updateData.age = validationResult.data.age;
    if (validationResult.data.phoneNumber !== undefined) updateData.phoneNumber = validationResult.data.phoneNumber;
    if (validationResult.data.emergencyContactName !== undefined) updateData.emergencyContactName = validationResult.data.emergencyContactName;
    if (validationResult.data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = validationResult.data.emergencyContactPhone;

    // Handle password update if password fields are provided
    if (validationResult.data.currentPassword && validationResult.data.newPassword) {
      const userWithPass = await User.findById(userId);
      if (!userWithPass || !userWithPass.password) {
        return NextResponse.json(
          { success: false, message: 'User account not found.' },
          { status: 404 }
        );
      }
      const isMatch = await bcrypt.compare(validationResult.data.currentPassword, userWithPass.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: 'Current password does not match.' },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(validationResult.data.newPassword, salt);
    }


    // 3. Process Profile Image upload if provided
    const file = formData.get('profileImage') as File | null;
    if (file && file.size > 0) {
      // Basic image check
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, message: 'Uploaded file must be a valid image.' },
          { status: 400 }
        );
      }

      // Max 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'Profile image size must not exceed 5MB.' },
          { status: 400 }
        );
      }

      // Convert Next.js File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const secureUrl = await uploadToCloudinary(buffer, 'profiles');
        updateData.profileImage = secureUrl;
      } catch (uploadErr) {
        console.error('[Update Profile API] Cloudinary upload failed:', uploadErr);
        return NextResponse.json(
          { success: false, message: 'Error uploading profile image to cloud storage.' },
          { status: 500 }
        );
      }
    }

    // Verify there is actually something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields provided for profile update.' },
        { status: 400 }
      );
    }

    // 4. Update Database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User account not found.' },
        { status: 404 }
      );
    }

    // 5. Cache Invalidation (Cache-Aside Strategy)
    const cacheKey = `user:profile:${userId}`;
    try {
      await redis.del(cacheKey);
      console.log(`[Update Profile API] Cache invalidated for key: ${cacheKey}`);
    } catch (redisErr) {
      console.warn('[Update Profile API] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        gender: updatedUser.gender || null,
        age: updatedUser.age || null,
        profileImage: updatedUser.profileImage || null,
        phoneNumber: updatedUser.phoneNumber || null,
        emergencyContactName: updatedUser.emergencyContactName || null,
        emergencyContactPhone: updatedUser.emergencyContactPhone || null
      }
    });

  } catch (err: any) {
    console.error('[Update Profile API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating profile.' },
      { status: 500 }
    );
  }
}
