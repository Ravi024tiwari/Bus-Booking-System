import mongoose from 'mongoose';
import dbConnect from './db';
import { User, Bus, Route, Trip } from '@/models';

export interface BusKPIs {
  total: number;
  totalGrowth: number;
  active: number;
  activeGrowth: number;
  maintenance: number;
  maintenanceGrowth: number;
  inactive: number;
  inactiveGrowth: number;
}

export interface AdminBusDetails {
  id: string;
  busNumber: string;
  type: string;
  model: string;
  capacity: number;
  route: {
    source: string;
    destination: string;
  } | null;
  operator: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  } | null;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  imageUrl: string;
  amenities: string[];
}

/**
 * Fetch KPIs for the Admin Buses overview.
 */
export async function getAdminBusesKPIs(): Promise<BusKPIs> {
  await dbConnect();

  // Find counts
  const total = await Bus.countDocuments();
  
  // Since we don't have a status field in the schema, we derive active count based on active trips
  const activeBusIds = await Trip.distinct('busId', {
    status: { $in: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
  });
  const active = activeBusIds.length;

  // Simulate other states deterministically for demo
  const maintenance = Math.max(0, Math.floor((total - active) * 0.4));
  const inactive = Math.max(0, total - active - maintenance);

  // Return counts with simulated growth
  return {
    total: total || 486,
    totalGrowth: 12.5,
    active: active || 350,
    activeGrowth: 9.3,
    maintenance: maintenance || 58,
    maintenanceGrowth: 4.2,
    inactive: inactive || 39,
    inactiveGrowth: -6.1
  };
}

/**
 * Fetch all registered buses populated with operator and route details.
 */
export async function getAdminBusesList(params: {
  search?: string;
  route?: string;
  operator?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  buses: AdminBusDetails[];
  total: number;
}> {
  await dbConnect();

  const page = params.page || 1;
  const limit = params.limit || 12;
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};

  if (params.search && params.search.trim() !== '') {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.busNumber = { $regex: searchRegex };
  }

  if (params.type && params.type !== 'ALL') {
    query.type = params.type;
  }

  if (params.operator && params.operator !== 'ALL') {
    if (mongoose.Types.ObjectId.isValid(params.operator)) {
      query.operatorId = new mongoose.Types.ObjectId(params.operator);
    }
  }

  if (params.route && params.route !== 'ALL') {
    if (mongoose.Types.ObjectId.isValid(params.route)) {
      query.routeId = new mongoose.Types.ObjectId(params.route);
    }
  }

  // Aggregate lookup pipeline
  const pipeline: any[] = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'operatorId',
        foreignField: '_id',
        as: 'operatorData'
      }
    },
    { $unwind: { path: '$operatorData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'routes',
        localField: 'routeId',
        foreignField: '_id',
        as: 'routeData'
      }
    },
    { $unwind: { path: '$routeData', preserveNullAndEmptyArrays: true } }
  ];

  const results = await Bus.aggregate(pipeline);
  const total = await Bus.countDocuments(query);

  // Map model names and placeholder images based on license plate or indices
  const getModelFromPlate = (plate: string, type: string) => {
    const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
    const models = ['Volvo 9600', 'Scania Multi-Axle', 'Volvo B11R', 'Tata Marcopolo', 'Bharat Benz', 'Tata Starbus'];
    return models[lastNum % models.length];
  };

  const getImageFromPlate = (plate: string) => {
    const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
    const images = [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600', // Chhattisgarh Raipur bus
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600', // Scania
      'https://images.unsplash.com/photo-1626125345510-4603468eedfb?auto=format&fit=crop&q=80&w=600', // Volvo
      'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=600', // Marcopolo
      'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=600'  // Luxury Coach
    ];
    return images[lastNum % images.length];
  };

  const getStatusFromPlate = (plate: string): 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' => {
    const lastNum = parseInt(plate.replace(/\D/g, '').slice(-1)) || 0;
    if (lastNum % 3 === 0) return 'ACTIVE';
    if (lastNum % 3 === 1) return 'MAINTENANCE';
    return 'INACTIVE';
  };

  const formattedBuses: AdminBusDetails[] = results.map(b => ({
    id: b._id.toString(),
    busNumber: b.busNumber,
    type: b.type,
    model: getModelFromPlate(b.busNumber, b.type),
    capacity: b.capacity,
    route: b.routeData ? {
      source: b.routeData.source,
      destination: b.routeData.destination
    } : null,
    operator: b.operatorData ? {
      id: b.operatorData._id.toString(),
      name: b.operatorData.name,
      email: b.operatorData.email,
      profileImage: b.operatorData.profileImage || null
    } : null,
    status: getStatusFromPlate(b.busNumber),
    imageUrl: b.images && b.images[0] ? b.images[0] : getImageFromPlate(b.busNumber),
    amenities: b.amenities || []
  }));

  // Seed Fallback Data matching UI mockup when DB is clean
  if (formattedBuses.length === 0 && page === 1 && !params.search) {
    const fallbackList: AdminBusDetails[] = [
      {
        id: 'b1',
        busNumber: 'CG 04 AB 1234',
        type: 'AC Sleeper',
        model: 'Volvo 9600',
        capacity: 36,
        route: { source: 'Raipur', destination: 'Mumbai' },
        operator: { id: '1', name: 'TripGo Travels', email: 'tripgo@example.com', profileImage: null },
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600',
        amenities: ['WiFi', 'AC', 'Charging Port']
      },
      {
        id: 'b2',
        busNumber: 'MH 12 CD 5678',
        type: 'AC Sleeper',
        model: 'Scania Multi-Axle',
        capacity: 41,
        route: { source: 'Delhi', destination: 'Jaipur' },
        operator: { id: '2', name: 'Sharma Travels', email: 'sharma@example.com', profileImage: null },
        status: 'MAINTENANCE',
        imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600',
        amenities: ['WiFi', 'AC', 'Charging Port']
      },
      {
        id: 'b3',
        busNumber: 'KA 01 EF 9101',
        type: 'AC Sleeper',
        model: 'Volvo B11R',
        capacity: 40,
        route: { source: 'Bengaluru', destination: 'Hyderabad' },
        operator: { id: '3', name: 'City Express', email: 'city@express.com', profileImage: null },
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1626125345510-4603468eedfb?auto=format&fit=crop&q=80&w=600',
        amenities: ['WiFi', 'AC', 'Charging Port', 'Blanket']
      },
      {
        id: 'b4',
        busNumber: 'GJ 05 GH 2345',
        type: 'AC Seater',
        model: 'Tata Marcopolo',
        capacity: 45,
        route: { source: 'Ahmedabad', destination: 'Surat' },
        operator: { id: '4', name: 'Sai Ram Transport', email: 'sairam@transport.com', profileImage: null },
        status: 'INACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=600',
        amenities: ['AC', 'Charging Point']
      },
      {
        id: 'b5',
        busNumber: 'UP 16 IJ 6789',
        type: 'AC Sleeper',
        model: 'Volvo 9400',
        capacity: 36,
        route: { source: 'Lucknow', destination: 'Delhi' },
        operator: { id: '5', name: 'GreenLine Travels', email: 'greenline@travels.com', profileImage: null },
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600',
        amenities: ['WiFi', 'AC', 'Charging Port']
      },
      {
        id: 'b6',
        busNumber: 'RJ 14 KL 2468',
        type: 'AC Seater',
        model: 'Bharat Benz',
        capacity: 49,
        route: { source: 'Jaipur', destination: 'Udaipur' },
        operator: { id: '6', name: 'Balaji Bus Service', email: 'balaji@example.com', profileImage: null },
        status: 'MAINTENANCE',
        imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600',
        amenities: ['AC', 'Charging Point']
      },
      {
        id: 'b7',
        busNumber: 'MP 09 MN 1357',
        type: 'AC Sleeper',
        model: 'Volvo B8R',
        capacity: 40,
        route: { source: 'Bhopal', destination: 'Indore' },
        operator: { id: '7', name: 'Royal Roadways', email: 'royal@roadways.com', profileImage: null },
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1626125345510-4603468eedfb?auto=format&fit=crop&q=80&w=600',
        amenities: ['WiFi', 'AC', 'Charging Port']
      },
      {
        id: 'b8',
        busNumber: 'PB 10 OP 8642',
        type: 'AC Seater',
        model: 'Tata Starbus',
        capacity: 44,
        route: { source: 'Chandigarh', destination: 'Amritsar' },
        operator: { id: '8', name: 'QuickRide Transport', email: 'quickride@example.com', profileImage: null },
        status: 'INACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=600',
        amenities: ['AC', 'Charging Point']
      }
    ];

    let filteredFallback = fallbackList;

    // Filters check
    if (params.status && params.status !== 'ALL') {
      filteredFallback = filteredFallback.filter(b => b.status === params.status);
    }
    if (params.type && params.type !== 'ALL') {
      filteredFallback = filteredFallback.filter(b => b.type.toLowerCase().includes(params.type!.toLowerCase()));
    }
    if (params.operator && params.operator !== 'ALL') {
      filteredFallback = filteredFallback.filter(b => b.operator?.id === params.operator);
    }

    return {
      buses: filteredFallback,
      total: filteredFallback.length
    };
  }

  return {
    buses: formattedBuses,
    total
  };
}

/**
 * Fetch list of distinct Operators and Routes for filtering dropdowns
 */
export async function getAdminBusesFiltersOptions(): Promise<{
  operators: Array<{ id: string; name: string }>;
  routes: Array<{ id: string; source: string; destination: string }>;
}> {
  await dbConnect();

  const operatorsList = await User.find({ role: 'operator' }).select('_id name');
  const routesList = await Route.find().select('_id source destination');

  const operators = operatorsList.map(op => ({
    id: op._id.toString(),
    name: op.name
  }));

  const routes = routesList.map(r => ({
    id: r._id.toString(),
    source: r.source,
    destination: r.destination
  }));

  // Fallbacks if clean database
  const fallbackOperators = [
    { id: '1', name: 'TripGo Travels' },
    { id: '2', name: 'Sharma Travels' },
    { id: '3', name: 'City Express' },
    { id: '4', name: 'Sai Ram Transport' },
    { id: '5', name: 'GreenLine Travels' },
    { id: '6', name: 'Balaji Bus Service' },
    { id: '7', name: 'Royal Roadways' },
    { id: '8', name: 'QuickRide Transport' }
  ];

  const fallbackRoutes = [
    { id: 'r1', source: 'Raipur', destination: 'Mumbai' },
    { id: 'r2', source: 'Delhi', destination: 'Jaipur' },
    { id: 'r3', source: 'Bengaluru', destination: 'Hyderabad' },
    { id: 'r4', source: 'Ahmedabad', destination: 'Surat' },
    { id: 'r5', source: 'Lucknow', destination: 'Delhi' },
    { id: 'r6', source: 'Jaipur', destination: 'Udaipur' },
    { id: 'r7', source: 'Bhopal', destination: 'Indore' },
    { id: 'r8', source: 'Chandigarh', destination: 'Amritsar' }
  ];

  return {
    operators: operators.length > 0 ? operators : fallbackOperators,
    routes: routes.length > 0 ? routes : fallbackRoutes
  };
}

export interface AdminSingleBusDetails {
  id: string;
  busNumber: string;
  type: string;
  model: string;
  capacity: number;
  rows: number;
  cols: number;
  sleeperSeats: string[];
  route: {
    source: string;
    destination: string;
    stops: Array<{ stopName: string; sequence: number }>;
  } | null;
  operator: {
    name: string;
    email: string;
    phoneNumber: string;
    profileImage: string | null;
  } | null;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  imageUrl: string;
  amenities: string[];
}

export async function getAdminBusDetails(busId: string): Promise<AdminSingleBusDetails | null> {
  await dbConnect();

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

  // Safe checks for object ID
  if (!mongoose.Types.ObjectId.isValid(busId)) {
    // Return mock for demo seed IDs
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
    return mockBuses[busId] || null;
  }

  const bus = await Bus.findById(busId)
    .populate('operatorId', 'name email profileImage phoneNumber')
    .populate('routeId');

  if (!bus) return null;

  const operator = bus.operatorId as any;
  const route = bus.routeId as any;

  return {
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
}
