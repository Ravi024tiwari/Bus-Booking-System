import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Wishlist } from '@/models';

/**
 * DELETE /api/wishlist/[wishlistId] - Remove an item from the wishlist.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    await dbConnect();
    const { wishlistId } = await params;

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 2. Fetch Wishlist Item
    const item = await Wishlist.findById(wishlistId);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Wishlist item not found.' },
        { status: 404 }
      );
    }

    // Ensure item belongs to the logged-in user
    if (item.passengerId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You do not own this wishlist item.' },
        { status: 403 }
      );
    }

    // 3. Delete Item
    await Wishlist.deleteOne({ _id: wishlistId });

    return NextResponse.json({
      success: true,
      message: 'Wishlist item removed successfully.'
    });

  } catch (err: any) {
    console.error('[Wishlist DELETE API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error deleting wishlist item.' },
      { status: 500 }
    );
  }
}
