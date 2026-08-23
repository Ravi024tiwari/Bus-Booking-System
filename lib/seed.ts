import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User, Bus, Trip, SeatState, Order, IdempotencyLog, Route, Review, TrackingSession } from '../models';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Load environment variables
dotenv.config();

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('[DNS] Failed to set Google DNS servers:', err);
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!mongoUri) {
  console.error('MONGODB_URI or MONGODB_URL is not defined in environment variables. Please check your .env file.');
  process.exit(1);
}

async function seed() {
  console.log('[Seeding] Connecting to database...');
  await mongoose.connect(mongoUri!);
  console.log('[Seeding] Connected. Cleaning collections...');

  // Clean existing collections to avoid duplicates
  await Promise.all([
    User.deleteMany({}),
    Bus.deleteMany({}),
    Route.deleteMany({}),
    Trip.deleteMany({}),
    SeatState.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    TrackingSession.deleteMany({}),
    IdempotencyLog.deleteMany({}),
  ]);

  console.log('[Seeding] Database cleared. Creating users...');

  // Generate Hashed Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Create Admin
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@seatplus.com',
    password: hashedPassword,
    role: 'admin',
  });

  // Create Operator
  const operator = await User.create({
    name: 'Royal Travels Operator',
    email: 'operator@royaltravels.com',
    password: hashedPassword,
    role: 'operator',
    operatorApprovalStatus: 'APPROVED',
  });

  // Create Passengers
  const passenger1 = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: hashedPassword,
    role: 'passenger',
  });

  const passenger2 = await User.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: hashedPassword,
    role: 'passenger',
  });

  const passenger3 = await User.create({
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: hashedPassword,
    role: 'passenger',
  });

  console.log('[Seeding] Users created. Creating routes...');

  // Create Routes
  const route1 = await Route.create({
    adminId: admin._id,
    source: 'Delhi',
    destination: 'Jaipur',
    stops: [
      { stopName: 'Delhi ISBT', arrivalOffsetMinutes: 0, departureOffsetMinutes: 10, sequence: 1, fareFromPreviousStop: 0 },
      { stopName: 'Gurugram IFFCO Chowk', arrivalOffsetMinutes: 45, departureOffsetMinutes: 50, sequence: 2, fareFromPreviousStop: 100 },
      { stopName: 'Jaipur Sindhi Camp', arrivalOffsetMinutes: 300, departureOffsetMinutes: 310, sequence: 3, fareFromPreviousStop: 350 }
    ]
  });

  const route2 = await Route.create({
    adminId: admin._id,
    source: 'Mumbai',
    destination: 'Pune',
    stops: [
      { stopName: 'Mumbai Borivali', arrivalOffsetMinutes: 0, departureOffsetMinutes: 15, sequence: 1, fareFromPreviousStop: 0 },
      { stopName: 'Navi Mumbai Vashi', arrivalOffsetMinutes: 60, departureOffsetMinutes: 65, sequence: 2, fareFromPreviousStop: 150 },
      { stopName: 'Pune Swargate', arrivalOffsetMinutes: 240, departureOffsetMinutes: 250, sequence: 3, fareFromPreviousStop: 600 }
    ]
  });

  console.log('[Seeding] Routes created. Creating buses...');

  // Create Seater Bus
  const seaterBus = await Bus.create({
    operatorId: operator._id,
    busNumber: 'DL 01 HA 1234',
    type: 'AC Seater',
    capacity: 40,
    rows: 10,
    cols: 4,
    sleeperSeats: [],
  });

  // Create Sleeper Bus
  const sleeperSeatsList: string[] = [];
  for (let r = 1; r <= 6; r++) {
    sleeperSeatsList.push(`L-${r}A`, `L-${r}B`, `U-${r}A`, `U-${r}B`);
  }

  const sleeperBus = await Bus.create({
    operatorId: operator._id,
    busNumber: 'MH 02 XY 9876',
    type: 'AC Sleeper',
    capacity: 24,
    rows: 6,
    cols: 2,
    sleeperSeats: sleeperSeatsList,
  });

  console.log('[Seeding] Buses created. Creating trips (current and historical)...');

  const now = new Date();
  
  // Trip 1: Delhi to Jaipur (Today + 4 hours)
  const departure1 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const arrival1 = new Date(departure1.getTime() + 5 * 60 * 60 * 1000);
  const trip1 = await Trip.create({
    busId: seaterBus._id,
    routeId: route1._id,
    busNumber: seaterBus.busNumber,
    busType: seaterBus.type,
    source: 'Delhi',
    destination: 'Jaipur',
    departureTime: departure1,
    arrivalTime: arrival1,
    status: 'SCHEDULED',
    fare: 450,
  });

  // Trip 2: Mumbai to Pune (Today - in transit/boarding)
  const departure2 = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Departed 1 hour ago
  const arrival2 = new Date(departure2.getTime() + 4 * 60 * 60 * 1000);
  const trip2 = await Trip.create({
    busId: sleeperBus._id,
    routeId: route2._id,
    busNumber: sleeperBus.busNumber,
    busType: sleeperBus.type,
    source: 'Mumbai',
    destination: 'Pune',
    departureTime: departure2,
    arrivalTime: arrival2,
    status: 'IN_TRANSIT',
    fare: 750,
  });

  // Trip 3: Historical Trip (Yesterday) - Delhi to Jaipur
  const departure3 = new Date(now.getTime() - 28 * 60 * 60 * 1000);
  const arrival3 = new Date(departure3.getTime() + 5 * 60 * 60 * 1000);
  const trip3 = await Trip.create({
    busId: seaterBus._id,
    routeId: route1._id,
    busNumber: seaterBus.busNumber,
    busType: seaterBus.type,
    source: 'Delhi',
    destination: 'Jaipur',
    departureTime: departure3,
    arrivalTime: arrival3,
    status: 'ARRIVED',
    fare: 450,
  });

  // Trip 4: Historical Trip (Yesterday) - Mumbai to Pune
  const departure4 = new Date(now.getTime() - 30 * 60 * 60 * 1000);
  const arrival4 = new Date(departure4.getTime() + 4 * 60 * 60 * 1000);
  const trip4 = await Trip.create({
    busId: sleeperBus._id,
    routeId: route2._id,
    busNumber: sleeperBus.busNumber,
    busType: sleeperBus.type,
    source: 'Mumbai',
    destination: 'Pune',
    departureTime: departure4,
    arrivalTime: arrival4,
    status: 'ARRIVED',
    fare: 750,
  });

  console.log('[Seeding] Trips created. Creating bookings & seat states...');

  // Seed bookings for current active Trip 1 (Delhi -> Jaipur)
  const order1 = await Order.create({
    passengerId: passenger1._id,
    tripId: trip1._id,
    seatNumbers: ['1A', '1B', '1C'],
    amount: 1350,
    status: 'CONFIRMED',
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // Booked 2 hours ago
  });

  await SeatState.create({ tripId: trip1._id, seatNumber: '1A', status: 'BOOKED' });
  await SeatState.create({ tripId: trip1._id, seatNumber: '1B', status: 'BOOKED' });
  await SeatState.create({ tripId: trip1._id, seatNumber: '1C', status: 'BOOKED' });

  // Seed bookings for Trip 2 (Mumbai -> Pune)
  const order2 = await Order.create({
    passengerId: passenger2._id,
    tripId: trip2._id,
    seatNumbers: ['L-1A', 'L-1B'],
    amount: 1500,
    status: 'CONFIRMED',
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
  });

  await SeatState.create({ tripId: trip2._id, seatNumber: 'L-1A', status: 'BOOKED' });
  await SeatState.create({ tripId: trip2._id, seatNumber: 'L-1B', status: 'BOOKED' });

  // Seed historical bookings for Trip 3 (Yesterday)
  await Order.create({
    passengerId: passenger3._id,
    tripId: trip3._id,
    seatNumbers: ['2A', '2B'],
    amount: 900,
    status: 'CONFIRMED',
    createdAt: new Date(now.getTime() - 32 * 60 * 60 * 1000)
  });

  // Seed historical bookings for Trip 4 (Yesterday)
  await Order.create({
    passengerId: passenger1._id,
    tripId: trip4._id,
    seatNumbers: ['L-2A', 'L-2B', 'U-2A'],
    amount: 2250,
    status: 'CONFIRMED',
    createdAt: new Date(now.getTime() - 34 * 60 * 60 * 1000)
  });

  console.log('[Seeding] Bookings created. Creating reviews...');

  // Create reviews for buses
  await Review.create({
    passengerId: passenger1._id,
    busId: seaterBus._id,
    bookingId: order1._id,
    rating: 5,
    comment: 'The bus was extremely comfortable, on time, and very clean. Excellent driver!',
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
  });

  await Review.create({
    passengerId: passenger2._id,
    busId: sleeperBus._id,
    bookingId: order2._id,
    rating: 4,
    comment: 'Charging ports were working, air conditioning was perfect. Had a minor delay leaving Vashi.',
    createdAt: new Date(now.getTime() - 10 * 60 * 1000)
  });

  console.log('[Seeding] Reviews created. Creating live tracking sessions...');

  // Create tracking session for Trip 2 (which is IN_TRANSIT)
  await TrackingSession.create({
    tripId: trip2._id,
    latitude: 19.0760, // Near Mumbai/Navi Mumbai
    longitude: 72.8777,
    updatedAt: now
  });

  console.log('----------------------------------------------------');
  console.log('[Seeding] Seeding successfully completed!');
  console.log(`Operator Account:  operator@royaltravels.com / password123`);
  console.log(`Passenger Account: john@example.com / password123`);
  console.log(`Delhi -> Jaipur (Today): ${trip1._id}`);
  console.log(`Mumbai -> Pune (In-Transit): ${trip2._id}`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  console.log('[Seeding] Database disconnected.');
}

seed().catch((err) => {
  console.error('[Seeding] Fatal error during seeding:', err);
  process.exit(1);
});
