import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User, Route } from '@/models';
import RoutesClient from './routes-client';

export const dynamic = 'force-dynamic';

export default async function AdminRoutesPage() {
  let initialRoutes: any[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();
      const user = await User.findById(decoded.id);

      if (!user || user.role !== 'admin') {
        redirect('/login');
      }

      // Fetch all routes sorted by newest first
      const routes = await Route.find().sort({ createdAt: -1 });
      initialRoutes = routes.map((route) => ({
        id: route._id.toString(),
        source: route.source,
        destination: route.destination,
        stops: route.stops.map((stop: any) => ({
          stopName: stop.stopName,
          arrivalOffsetMinutes: stop.arrivalOffsetMinutes,
          departureOffsetMinutes: stop.departureOffsetMinutes,
          sequence: stop.sequence,
          fareFromPreviousStop: stop.fareFromPreviousStop,
        })),
        totalDistance: route.totalDistance || 0,
        description: route.description || '',
        createdAt: route.createdAt.toISOString(),
      }));
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Admin Routes Server Page] Authentication validation failure:', err);
    redirect('/login');
  }

  return <RoutesClient initialRoutes={initialRoutes} />;
}
