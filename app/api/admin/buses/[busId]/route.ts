import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import dbConnect from '@/lib/db';
import { Bus, User, Route } from '@/models';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ busId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { busId } = await params;
    await dbConnect();

    // Find the bus
    const bus = await Bus.findById(busId)
      .populate('operatorId', 'name email profileImage phoneNumber')
      .populate('routeId');

    // Mappings and Fallbacks
    const getModelFromPlate = (plate: string) => {
      const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
      const models = ['Volvo 9600', 'Scania Multi-Axle', 'Volvo B11R', 'Tata Marcopolo', 'Bharat Benz', 'Tata Starbus'];
      return models[lastNum % models.length];
    };

    const getImageFromPlate = (plate: string) => {
      const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
      const images = [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1626125345510-4603468eedfb?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=600'
      ];
      return images[lastNum % images.length];
    };

    const getStatusFromPlate = (plate: string): 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' => {
      const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
      if (lastNum % 3 === 0) return 'ACTIVE';
      if (lastNum % 3 === 1) return 'MAINTENANCE';
      return 'INACTIVE';
    };

    if (!bus) {
      // Mock details fallback for seed UI IDs (e.g. b1, b2, etc.)
      const mockBuses: Record<string, any> = {
        b1: {
          id: 'b1',
          busNumber: 'CG 04 AB 1234',
          type: 'AC Sleeper',
          model: 'Volvo 9600',
          capacity: 36,
          rows: 6,
          cols: 6,
          sleeperSeats: ['L-1A', 'U-1B', 'L-2A', 'U-2B'],
          route: { source: 'Raipur', destination: 'Mumbai', stops: [{ stopName: 'Raipur', sequence: 1 }, { stopName: 'Mumbai', sequence: 2 }] },
          operator: { name: 'TripGo Travels', email: 'tripgo@example.com', phoneNumber: '+91 98765 43210', profileImage: null },
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200',
          amenities: ['AC', 'Wi-Fi', 'Charging Point', 'Blanket', 'Pillow', 'Water Bottle', 'GPS Tracking']
        },
        b2: {
          id: 'b2',
          busNumber: 'MH 12 CD 5678',
          type: 'AC Sleeper',
          model: 'Scania Multi-Axle',
          capacity: 41,
          rows: 7,
          cols: 6,
          sleeperSeats: ['L-1A', 'U-1B'],
          route: { source: 'Delhi', destination: 'Jaipur', stops: [{ stopName: 'Delhi', sequence: 1 }, { stopName: 'Jaipur', sequence: 2 }] },
          operator: { name: 'Sharma Travels', email: 'sharma@example.com', phoneNumber: '+91 87654 32109', profileImage: null },
          status: 'MAINTENANCE',
          imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1200',
          amenities: ['AC', 'Wi-Fi', 'Charging Point', 'Water Bottle']
        },
        b3: {
          id: 'b3',
          busNumber: 'KA 01 EF 9101',
          type: 'AC Sleeper',
          model: 'Volvo B11R',
          capacity: 40,
          rows: 6,
          cols: 6,
          sleeperSeats: [],
          route: { source: 'Bengaluru', destination: 'Hyderabad', stops: [{ stopName: 'Bengaluru', sequence: 1 }, { stopName: 'Hyderabad', sequence: 2 }] },
          operator: { name: 'City Express', email: 'city@express.com', phoneNumber: '+91 76543 21098', profileImage: null },
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1626125345510-4603468eedfb?auto=format&fit=crop&q=80&w=1200',
          amenities: ['AC', 'Wi-Fi', 'Charging Point', 'Blanket', 'GPS Tracking']
        },
        b4: {
          id: 'b4',
          busNumber: 'GJ 05 GH 2345',
          type: 'AC Seater',
          model: 'Tata Marcopolo',
          capacity: 45,
          rows: 9,
          cols: 5,
          sleeperSeats: [],
          route: { source: 'Ahmedabad', destination: 'Surat', stops: [{ stopName: 'Ahmedabad', sequence: 1 }, { stopName: 'Surat', sequence: 2 }] },
          operator: { name: 'Sai Ram Transport', email: 'sairam@transport.com', phoneNumber: '+91 65432 10987', profileImage: null },
          status: 'INACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=1200',
          amenities: ['AC', 'Charging Point', 'GPS Tracking']
        }
      };

      const mockBus = mockBuses[busId];
      if (mockBus) {
        return NextResponse.json({
          success: true,
          data: mockBus
        });
      }

      return NextResponse.json(
        { success: false, message: 'Bus not found.' },
        { status: 404 }
      );
    }

    const operator = bus.operatorId as any;
    const route = bus.routeId as any;

    const data = {
      id: bus._id.toString(),
      busNumber: bus.busNumber,
      type: bus.type,
      model: getModelFromPlate(bus.busNumber),
      capacity: bus.capacity,
      rows: bus.rows,
      cols: bus.cols,
      sleeperSeats: bus.sleeperSeats || [],
      route: route ? {
        source: route.source,
        destination: route.destination,
        stops: route.stops || []
      } : null,
      operator: operator ? {
        name: operator.name,
        email: operator.email,
        phoneNumber: operator.phoneNumber || '+91 98765 43210',
        profileImage: operator.profileImage || null
      } : null,
      status: getStatusFromPlate(bus.busNumber),
      imageUrl: bus.images && bus.images[0] ? bus.images[0] : getImageFromPlate(bus.busNumber),
      amenities: bus.amenities || []
    };

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Admin Bus Detail GET API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching bus details.' },
      { status: 500 }
    );
  }
}
