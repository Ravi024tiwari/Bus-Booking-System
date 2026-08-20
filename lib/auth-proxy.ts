import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { auth } from '@/lib/auth';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'operator' | 'admin';
  operatorApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Standardized security verification proxy for Next.js App Router API endpoints.
 * Validates JWT, user role, and operator approval status.
 *
 * @param allowedRoles Array of roles permitted to access the endpoint (e.g. ['operator', 'admin'])
 * @returns An object containing either the verified user or a pre-formatted error NextResponse
 */
export async function verifyAuth(
  allowedRoles?: Array<'passenger' | 'operator' | 'admin'>
): Promise<{ user: AuthenticatedUser | null; errorResponse?: NextResponse }> {
  try {
    await dbConnect();

    // 1. Extract session token from cookie store
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let userId: string | null = null;

    // 2. Decode and verify JWT (if present)
    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
      try {
        const decoded: any = jwt.verify(token, jwtSecret);
        userId = decoded.id;
      } catch (err) {
        // Invalid or expired credentials token, let it fall through to check Better Auth
      }
    }

    // 3. Check for a Better Auth session (Google Login)
    if (!userId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session) {
        userId = session.user.id;
      }
    }

    if (!userId) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, message: 'Authentication required. Please log in.' },
          { status: 401 }
        ),
      };
    }

    // 4. Retrieve current user record from Database (confirms live approval status)
    const user = await User.findById(userId);
    if (!user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, message: 'User account not found.' },
          { status: 404 }
        ),
      };
    }

    // 4. Assert role restriction (if applicable)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, message: 'Access denied. You do not have the required role permissions.' },
          { status: 403 }
        ),
      };
    }

    // 5. Assert operator approval status
    if (user.role === 'operator' && user.operatorApprovalStatus !== 'APPROVED') {
      const messageMap: Record<string, string> = {
        PENDING: 'Access denied. Your operator registration is currently pending admin approval.',
        REJECTED: 'Access denied. Your operator registration was rejected.',
      };
      const message = messageMap[user.operatorApprovalStatus || ''] || 'Access denied. Account is inactive.';
      
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, message },
          { status: 403 }
        ),
      };
    }

    // 6. Return successfully verified user context
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        operatorApprovalStatus: user.operatorApprovalStatus,
      },
    };

  } catch (error) {
    console.error('[Auth Proxy] Fatal authentication error:', error);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: 'Internal server error validating authentication.' },
        { status: 500 }
      ),
    };
  }
}
