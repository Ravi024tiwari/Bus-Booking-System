import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Offer, Trip } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/operator/offers - List all offers created by the authenticated operator.
 */
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const offers = await Offer.find({ operatorId: user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tripId',
        select: 'source destination date departureTime fare busNumber busType status offerBookedCount'
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: offers
    });
  } catch (error: any) {
    console.error('[Operator Offers GET API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch offers.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/operator/offers - Create a new Offer template for the operator.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      title, 
      code, 
      description, 
      discountPercentage, 
      maxDiscountAmount, 
      offerLimit, 
      validFrom, 
      validTill,
      badgeText,
      bannerImage,
      tripId
    } = body;

    if (!title || !code || discountPercentage === undefined || offerLimit === undefined || !validTill) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: title, code, discountPercentage, offerLimit, validTill.' },
        { status: 400 }
      );
    }

    const parsedDiscount = Number(discountPercentage);
    if (isNaN(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 100) {
      return NextResponse.json(
        { success: false, message: 'Discount percentage must be between 1 and 100.' },
        { status: 400 }
      );
    }

    const parsedLimit = Number(offerLimit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return NextResponse.json(
        { success: false, message: 'Offer passenger limit must be at least 1.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if operator already has an active offer with this code
    const existing = await Offer.findOne({ operatorId: user.id, code: cleanCode, isActive: true });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `An active offer with code "${cleanCode}" already exists for your account.` },
        { status: 400 }
      );
    }

    const newOffer = await Offer.create({
      operatorId: user.id,
      title: title.trim(),
      code: cleanCode,
      description: description?.trim() || '',
      discountPercentage: parsedDiscount,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : 0,
      offerLimit: parsedLimit,
      tripId: tripId || null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTill: new Date(validTill),
      badgeText: badgeText || 'SPECIAL OFFER',
      bannerImage: bannerImage || '/images/volvo.png',
      isActive: true
    });

    // If tripId is provided during offer creation, assign offer to trip as well
    if (tripId) {
      await Trip.findOneAndUpdate(
        { _id: tripId },
        {
          offerId: newOffer._id,
          offerPercentage: parsedDiscount,
          offerLimit: parsedLimit
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer created successfully.',
      data: newOffer
    });
  } catch (error: any) {
    console.error('[Operator Offers POST API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error creating offer.' },
      { status: 500 }
    );
  }
}
