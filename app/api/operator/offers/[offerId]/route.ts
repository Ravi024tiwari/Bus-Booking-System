import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Offer, Trip } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ offerId: string }>;
}

/**
 * GET /api/operator/offers/[offerId] - Fetch single offer
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    await dbConnect();
    const { offerId } = await params;

    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const offer = await Offer.findOne({ _id: offerId, operatorId: user.id })
      .populate('tripId')
      .lean();

    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: offer
    });
  } catch (error: any) {
    console.error('[Operator Offer GET by ID API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch offer.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/operator/offers/[offerId] - Update offer details or toggle status
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await dbConnect();
    const { offerId } = await params;

    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const offer = await Offer.findOne({ _id: offerId, operatorId: user.id });
    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      discountPercentage, 
      maxDiscountAmount, 
      offerLimit, 
      validTill,
      isActive,
      tripId,
      badgeText,
      bannerImage
    } = body;

    if (title !== undefined) offer.title = title.trim();
    if (description !== undefined) offer.description = description.trim();
    if (discountPercentage !== undefined) offer.discountPercentage = Number(discountPercentage);
    if (maxDiscountAmount !== undefined) offer.maxDiscountAmount = Number(maxDiscountAmount);
    if (offerLimit !== undefined) offer.offerLimit = Number(offerLimit);
    if (validTill !== undefined) offer.validTill = new Date(validTill);
    if (isActive !== undefined) offer.isActive = Boolean(isActive);
    if (badgeText !== undefined) offer.badgeText = badgeText;
    if (bannerImage !== undefined) offer.bannerImage = bannerImage;

    // Handle re-assigning or unlinking trip
    if (tripId !== undefined) {
      // If previously linked to another trip, clean up old trip
      if (offer.tripId && offer.tripId.toString() !== tripId) {
        await Trip.findByIdAndUpdate(offer.tripId, {
          offerId: null,
          offerPercentage: 0,
          offerLimit: 0
        });
      }

      offer.tripId = tripId || null;

      // Sync new trip
      if (tripId) {
        await Trip.findByIdAndUpdate(tripId, {
          offerId: offer._id,
          offerPercentage: offer.discountPercentage,
          offerLimit: offer.offerLimit
        });
      }
    }

    await offer.save();

    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully.',
      data: offer
    });
  } catch (error: any) {
    console.error('[Operator Offer PATCH API] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update offer.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/operator/offers/[offerId] - Delete or deactivate an offer
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await dbConnect();
    const { offerId } = await params;

    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const offer = await Offer.findOne({ _id: offerId, operatorId: user.id });
    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Offer not found.' },
        { status: 404 }
      );
    }

    // Unlink trip if linked
    if (offer.tripId) {
      await Trip.findByIdAndUpdate(offer.tripId, {
        offerId: null,
        offerPercentage: 0,
        offerLimit: 0
      });
    }

    await Offer.findByIdAndDelete(offerId);

    return NextResponse.json({
      success: true,
      message: 'Offer removed successfully.'
    });
  } catch (error: any) {
    console.error('[Operator Offer DELETE API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete offer.' },
      { status: 500 }
    );
  }
}
