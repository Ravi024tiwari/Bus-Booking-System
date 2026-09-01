import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Offer, Trip, Bus } from '@/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/offers - Fetch all active, valid promotional offers available for customers.
 */
export async function GET() {
  try {
    await dbConnect();
    const now = new Date();

    // Fetch active offers whose validity date has not expired
    const activeOffers = await Offer.find({
      isActive: true,
      validTill: { $gte: now }
    })
      .sort({ discountPercentage: -1, createdAt: -1 })
      .populate({
        path: 'tripId',
        match: { status: { $ne: 'CANCELLED' } },
        populate: {
          path: 'busId',
          select: 'busNumber type images name'
        }
      })
      .lean();

    const formattedOffers = activeOffers
      .filter((offer: any) => offer.tripId) // only return offers with valid scheduled trips
      .map((offer: any) => {
        const trip = offer.tripId;
        const bus = trip?.busId;
        const baseFare = trip?.fare || 0;
        const discountVal = offer.discountPercentage || 0;
        const discountAmount = Math.round((baseFare * discountVal) / 100);
        const finalFare = Math.max(0, baseFare - discountAmount);
        const booked = trip?.offerBookedCount || 0;
        const remaining = Math.max(0, offer.offerLimit - booked);

        const busImage = bus?.images && bus.images.length > 0 && bus.images[0]?.trim() !== ''
          ? bus.images[0]
          : offer.bannerImage || '/images/volvo.png';

        return {
          id: offer._id.toString(),
          code: offer.code,
          title: offer.title,
          description: offer.description,
          discountPercentage: offer.discountPercentage,
          maxDiscountAmount: offer.maxDiscountAmount,
          offerLimit: offer.offerLimit,
          offerBookedCount: booked,
          remainingSeats: remaining,
          isLimitReached: remaining <= 0,
          badgeText: offer.badgeText || `${offer.discountPercentage}% OFF`,
          bannerImage: busImage,
          themeColor: offer.themeColor,
          validTill: offer.validTill,
          tripDetails: {
            tripId: trip._id.toString(),
            source: trip.source,
            destination: trip.destination,
            date: trip.date,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            originalFare: baseFare,
            discountedFare: finalFare,
            discountAmount: discountAmount,
            busNumber: bus?.busNumber || trip.busNumber,
            busType: bus?.type || trip.busType,
            busImage: busImage
          }
        };
      });

    return NextResponse.json({
      success: true,
      data: formattedOffers
    });
  } catch (error: any) {
    console.error('[Public Offers API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer offers.' },
      { status: 500 }
    );
  }
}
