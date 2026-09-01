import dbConnect from './db';
import { Offer, Trip, Bus } from '@/models';

export interface DiscountedTripOffer {
  id: string;
  tripId: string;
  code: string;
  title: string;
  source: string;
  destination: string;
  date: string;
  departureTime?: string;
  busType: string;
  busNumber: string;
  busImage: string;
  originalFare: number;
  discountPercentage: number;
  discountAmount: number;
  discountedFare: number;
  offerLimit: number;
  offerBookedCount: number;
  remainingSeats: number;
  badgeText: string;
}

const LOCAL_FALLBACK_BUS_IMAGES = [
  '/images/volvo.png',
  '/images/volvo2.png',
  '/images/bus1.jpg',
  '/images/bus2.jpg',
  '/images/bus-hero.jpg',
];

/**
 * Server-side helper to fetch active discounted trips recommended for customer dashboard.
 */
export async function getActiveDiscountedOffers(limit = 4): Promise<DiscountedTripOffer[]> {
  await dbConnect();

  try {
    const now = new Date();

    // 1. Fetch active offers that have an attached trip
    const activeOffers = await Offer.find({
      isActive: true,
      validTill: { $gte: now },
      tripId: { $ne: null }
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

    const results: DiscountedTripOffer[] = [];
    const seenTripIds = new Set<string>();

    for (let i = 0; i < activeOffers.length; i++) {
      const offer: any = activeOffers[i];
      const trip: any = offer.tripId;
      if (!trip) continue;

      const tripIdStr = trip._id.toString();
      if (seenTripIds.has(tripIdStr)) continue;
      seenTripIds.add(tripIdStr);

      const bus: any = trip.busId;
      const baseFare = trip.fare || 500;
      const discountPct = offer.discountPercentage || trip.offerPercentage || 15;
      const discountAmount = Math.round((baseFare * discountPct) / 100);
      const finalFare = Math.max(0, baseFare - discountAmount);
      const booked = trip.offerBookedCount || 0;
      const limitCount = offer.offerLimit || trip.offerLimit || 10;
      const remaining = Math.max(0, limitCount - booked);

      const busImg = bus?.images && bus.images.length > 0 && bus.images[0]?.trim() !== ''
        ? bus.images[0]
        : offer.bannerImage || LOCAL_FALLBACK_BUS_IMAGES[i % LOCAL_FALLBACK_BUS_IMAGES.length];

      results.push({
        id: offer._id.toString(),
        tripId: tripIdStr,
        code: offer.code,
        title: offer.title || `${discountPct}% Discount Special`,
        source: trip.source,
        destination: trip.destination,
        date: trip.date,
        departureTime: trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        busType: bus?.type || trip.busType || 'AC Sleeper',
        busNumber: bus?.busNumber || trip.busNumber || 'Express Coach',
        busImage: busImg,
        originalFare: baseFare,
        discountPercentage: discountPct,
        discountAmount: discountAmount,
        discountedFare: finalFare,
        offerLimit: limitCount,
        offerBookedCount: booked,
        remainingSeats: remaining,
        badgeText: offer.badgeText || `${discountPct}% OFF`
      });

      if (results.length >= limit) break;
    }

    // 2. If fewer than limit, check trips that directly have offerPercentage > 0
    if (results.length < limit) {
      const tripOnlyOffers = await Trip.find({
        _id: { $nin: Array.from(seenTripIds) },
        offerPercentage: { $gt: 0 },
        status: { $ne: 'CANCELLED' }
      })
        .sort({ offerPercentage: -1, departureTime: 1 })
        .limit(limit)
        .populate({
          path: 'busId',
          select: 'busNumber type images name'
        })
        .lean();

      for (let j = 0; j < tripOnlyOffers.length; j++) {
        if (results.length >= limit) break;
        const trip: any = tripOnlyOffers[j];
        const tripIdStr = trip._id.toString();
        const bus: any = trip.busId;
        const baseFare = trip.fare || 500;
        const discountPct = trip.offerPercentage || 15;
        const discountAmount = Math.round((baseFare * discountPct) / 100);
        const finalFare = Math.max(0, baseFare - discountAmount);
        const booked = trip.offerBookedCount || 0;
        const limitCount = trip.offerLimit || 10;
        const remaining = Math.max(0, limitCount - booked);

        const busImg = bus?.images && bus.images.length > 0 && bus.images[0]?.trim() !== ''
          ? bus.images[0]
          : LOCAL_FALLBACK_BUS_IMAGES[(results.length) % LOCAL_FALLBACK_BUS_IMAGES.length];

        results.push({
          id: `trip-deal-${tripIdStr}`,
          tripId: tripIdStr,
          code: `DEAL${discountPct}`,
          title: `${discountPct}% Route Special`,
          source: trip.source,
          destination: trip.destination,
          date: trip.date,
          departureTime: trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          busType: bus?.type || trip.busType || 'AC Sleeper',
          busNumber: bus?.busNumber || trip.busNumber || 'Express Coach',
          busImage: busImg,
          originalFare: baseFare,
          discountPercentage: discountPct,
          discountAmount: discountAmount,
          discountedFare: finalFare,
          offerLimit: limitCount,
          offerBookedCount: booked,
          remainingSeats: remaining,
          badgeText: `${discountPct}% OFF`
        });
      }
    }

    // 3. Fallback mock offers if database has no discounted trips yet
    if (results.length === 0) {
      return [
        {
          id: 'fb-deal-1',
          tripId: 'fb-1',
          code: 'EARLY20',
          title: 'Early Bird Special',
          source: 'Raipur',
          destination: 'Mumbai',
          date: '2026-10-15',
          departureTime: '08:00 PM',
          busType: 'AC Sleeper Volvo',
          busNumber: 'CG-04-AB-1234',
          busImage: '/images/volvo.png',
          originalFare: 1099,
          discountPercentage: 20,
          discountAmount: 220,
          discountedFare: 879,
          offerLimit: 10,
          offerBookedCount: 4,
          remainingSeats: 6,
          badgeText: '20% OFF'
        },
        {
          id: 'fb-deal-2',
          tripId: 'fb-2',
          code: 'METRO25',
          title: 'Metro Express Deal',
          source: 'Raipur',
          destination: 'Delhi',
          date: '2026-10-18',
          departureTime: '06:30 PM',
          busType: 'Multi-Axle Luxury',
          busNumber: 'CG-04-CD-5678',
          busImage: '/images/volvo2.png',
          originalFare: 1299,
          discountPercentage: 25,
          discountAmount: 325,
          discountedFare: 974,
          offerLimit: 8,
          offerBookedCount: 3,
          remainingSeats: 5,
          badgeText: '25% OFF'
        },
        {
          id: 'fb-deal-3',
          tripId: 'fb-3',
          code: 'FLASH15',
          title: 'Weekend Flash Saver',
          source: 'Nagpur',
          destination: 'Pune',
          date: '2026-10-20',
          departureTime: '09:15 PM',
          busType: 'AC Executive Coach',
          busNumber: 'MH-31-EF-9012',
          busImage: '/images/bus1.jpg',
          originalFare: 799,
          discountPercentage: 15,
          discountAmount: 120,
          discountedFare: 679,
          offerLimit: 12,
          offerBookedCount: 7,
          remainingSeats: 5,
          badgeText: '15% OFF'
        }
      ];
    }

    return results;
  } catch (err) {
    console.error('[getActiveDiscountedOffers] Error:', err);
    return [];
  }
}
