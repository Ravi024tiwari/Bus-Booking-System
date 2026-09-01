import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order, Trip, Bus, User } from '@/models';

export async function GET() {
  try {
    await dbConnect();

    // 1. Authenticate Passenger from Cookie
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
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const now = new Date();

    // Date boundaries for monthly calculations
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 2. Fetch all orders for this passenger with populated Trip and Bus
    const orders = await Order.find({ passengerId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tripId',
        populate: {
          path: 'busId',
          select: 'busNumber type operatorId name images amenities'
        }
      });

    // 3. Populate operator details for populated trips
    const operatorIds = Array.from(
      new Set(
        orders
          .map((o: any) => o.tripId?.busId?.operatorId)
          .filter(Boolean)
          .map((id: any) => id.toString())
      )
    );

    const operators = operatorIds.length > 0
      ? await User.find({ _id: { $in: operatorIds } }).select('name email phoneNumber').lean()
      : [];

    const operatorMap = new Map(operators.map((op: any) => [op._id.toString(), op]));

    // 4. Compute Metrics
    let completedTrips = 0;
    let completedThisMonth = 0;
    let upcomingTrips = 0;
    let spentThisMonth = 0;
    let spentLastMonth = 0;
    let totalSpent = 0;
    let totalSavings = 0;

    const upcomingOrdersList: any[] = [];

    orders.forEach((order: any) => {
      const isConfirmed = order.status === 'CONFIRMED';
      const trip = order.tripId;
      const orderCreatedAt = new Date(order.createdAt);
      const departureTime = trip?.departureTime ? new Date(trip.departureTime) : null;

      if (isConfirmed) {
        totalSpent += order.amount || 0;
        totalSavings += order.discountAmount || 0;

        // Spending by month
        if (orderCreatedAt >= startOfCurrentMonth) {
          spentThisMonth += order.amount || 0;
        } else if (orderCreatedAt >= startOfLastMonth && orderCreatedAt <= endOfLastMonth) {
          spentLastMonth += order.amount || 0;
        }

        // Trip timing classification
        if (departureTime) {
          if (departureTime >= now && trip.status !== 'CANCELLED') {
            upcomingTrips++;
            upcomingOrdersList.push(order);
          } else {
            completedTrips++;
            if (departureTime >= startOfCurrentMonth) {
              completedThisMonth++;
            }
          }
        } else {
          completedTrips++;
        }
      }
    });

    // Spent change percentage vs last month
    let spentChangePercent: number | null = null;
    if (spentLastMonth > 0) {
      spentChangePercent = Math.round(((spentThisMonth - spentLastMonth) / spentLastMonth) * 100);
    } else if (spentThisMonth > 0 && spentLastMonth === 0) {
      spentChangePercent = 100;
    }

    // Reward points formula: total savings + 10% of total confirmed spent
    const rewardPoints = Math.round(totalSavings + totalSpent * 0.1);

    // 5. Determine next upcoming trip (closest departure time in future)
    let nextTrip: any = null;
    if (upcomingOrdersList.length > 0) {
      upcomingOrdersList.sort((a, b) => {
        const timeA = new Date(a.tripId.departureTime).getTime();
        const timeB = new Date(b.tripId.departureTime).getTime();
        return timeA - timeB;
      });

      const nearestOrder = upcomingOrdersList[0];
      const trip = nearestOrder.tripId;
      const bus = trip?.busId;
      const operator = bus?.operatorId ? operatorMap.get(bus.operatorId.toString()) : null;

      const depDate = new Date(trip.departureTime);
      const formattedDate = depDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const formattedTime = depDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      nextTrip = {
        id: trip._id,
        orderId: nearestOrder._id,
        source: trip.source || nearestOrder.fromStop,
        destination: trip.destination || nearestOrder.toStop,
        fromStop: nearestOrder.fromStop || trip.source,
        toStop: nearestOrder.toStop || trip.destination,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        formattedDate,
        formattedTime,
        date: formattedDate,
        time: formattedTime,
        seatNumbers: nearestOrder.seatNumbers,
        seatsFormatted: nearestOrder.seatNumbers.join(', '),
        amount: nearestOrder.amount,
        fare: trip.fare || nearestOrder.amount,
        pnr: nearestOrder.razorpayOrderId || nearestOrder._id.toString().substring(0, 10).toUpperCase(),
        busNumber: bus?.busNumber || trip.busNumber,
        busType: bus?.type || trip.busType || 'AC Sleeper',
        busImage: bus?.images?.[0] || '/images/bus-hero.jpg',
        operatorName: operator?.name || 'MoveGo Travels',
        status: trip.status || 'SCHEDULED'
      };
    }

    // Next trip date string for KPI card
    let nextTripDate: string | null = null;
    if (nextTrip) {
      nextTripDate = nextTrip.formattedDate;
    }

    // 6. Fetch Popular Routes from Database or fallback
    const CITY_IMAGE_MAP: Record<string, string> = {
      mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
      delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
      pune: 'https://images.unsplash.com/photo-1600100397608-f010f421a97d?auto=format&fit=crop&w=600&q=80',
      indore: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80',
      jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
      hyderabad: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=600&q=80',
      goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
      bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
    };

    let popularRoutes: any[] = [];
    try {
      const activeTrips = await Trip.find({ status: { $ne: 'CANCELLED' } })
        .limit(16)
        .sort({ departureTime: -1 })
        .lean();

      const uniqueRoutesMap = new Map();
      activeTrips.forEach((t: any) => {
        const key = `${t.source}-${t.destination}`;
        if (!uniqueRoutesMap.has(key)) {
          const destKey = (t.destination || '').toLowerCase().trim();
          const srcKey = (t.source || '').toLowerCase().trim();
          const img = CITY_IMAGE_MAP[destKey] || CITY_IMAGE_MAP[srcKey] || 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80';
          uniqueRoutesMap.set(key, {
            source: t.source,
            destination: t.destination,
            fare: t.fare.toLocaleString('en-IN'),
            image: img
          });
        }
      });

      popularRoutes = Array.from(uniqueRoutesMap.values()).slice(0, 8);
    } catch (e) {
      console.error('[Dashboard API] Error fetching popular routes:', e);
    }

    if (popularRoutes.length < 8) {
      const fallbackRoutes = [
        { source: 'Raipur', destination: 'Mumbai', fare: '1,099', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80' },
        { source: 'Raipur', destination: 'Delhi', fare: '1,299', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80' },
        { source: 'Nagpur', destination: 'Pune', fare: '799', image: 'https://images.unsplash.com/photo-1600100397608-f010f421a97d?auto=format&fit=crop&w=600&q=80' },
        { source: 'Bhopal', destination: 'Indore', fare: '699', image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80' },
        { source: 'Delhi', destination: 'Jaipur', fare: '499', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80' },
        { source: 'Bengaluru', destination: 'Hyderabad', fare: '899', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=600&q=80' },
        { source: 'Mumbai', destination: 'Goa', fare: '1,199', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' },
        { source: 'Chennai', destination: 'Coimbatore', fare: '649', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80' }
      ];
      popularRoutes = [...popularRoutes, ...fallbackRoutes].slice(0, 8);
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          completedTrips,
          completedThisMonth,
          upcomingTrips,
          nextTripDate,
          spentThisMonth,
          spentLastMonth,
          spentChangePercent,
          rewardPoints,
          totalSpent,
          totalSavings
        },
        nextTrip,
        popularRoutes
      }
    });

  } catch (err: any) {
    console.error('[Customer Dashboard API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error computing customer dashboard data.' },
      { status: 500 }
    );
  }
}
