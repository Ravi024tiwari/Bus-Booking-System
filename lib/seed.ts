import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User, Bus, Trip, SeatState, Order, IdempotencyLog } from '../models';

// Load environment variables
dotenv.config();

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

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
    Trip.deleteMany({}),
    SeatState.deleteMany({}),
    Order.deleteMany({}),
    IdempotencyLog.deleteMany({}),
  ]);

  console.log('[Seeding] Database cleared. Creating users...');

  // Create Operator
  const operator = await User.create({
    name: 'Royal Travels Operator',
    email: 'operator@royaltravels.com',
    password: 'password123', // Plain text for local dev/testing
    role: 'operator',
  });

  // Create Passenger
  const passenger = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'passenger',
  });

  console.log('[Seeding] Users created. Creating buses...');

  // Create Seater Bus: 10 rows, 4 columns (2x2 layout = 40 seats)
  const seaterBus = await Bus.create({
    operatorId: operator._id,
    busNumber: 'DL 01 HA 1234',
    type: 'AC Seater',
    capacity: 40,
    rows: 10,
    cols: 4,
    sleeperSeats: [], // Seater bus has no sleepers
  });

  // Create Sleeper Bus: 6 rows, 2 columns per deck (total 2 decks: Lower & Upper)
  // Let's create seat layouts. We can represent sleepers by naming them (e.g. L-1A, L-1B, U-1A, U-1B)
  const sleeperSeatsList: string[] = [];
  for (let r = 1; r <= 6; r++) {
    sleeperSeatsList.push(`L-${r}A`, `L-${r}B`, `U-${r}A`, `U-1B`);
  }

  const sleeperBus = await Bus.create({
    operatorId: operator._id,
    busNumber: 'MH 02 XY 9876',
    type: 'AC Sleeper',
    capacity: 24,
    rows: 6,
    cols: 2, // 2 columns of sleeper berths side by side
    sleeperSeats: sleeperSeatsList, // All seats on this sleeper bus are sleepers
  });

  console.log('[Seeding] Buses created. Creating scheduled trips...');

  const now = new Date();
  
  // Trip 1: Delhi to Jaipur (Seater Bus) - Departure today + 4 hours
  const departure1 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const arrival1 = new Date(departure1.getTime() + 5 * 60 * 60 * 1000); // 5 hour journey
  
  const trip1 = await Trip.create({
    busId: seaterBus._id,
    busNumber: seaterBus.busNumber,
    busType: seaterBus.type,
    source: 'Delhi',
    destination: 'Jaipur',
    departureTime: departure1,
    arrivalTime: arrival1,
    fare: 450,
  });

  // Trip 2: Mumbai to Pune (Sleeper Bus) - Departure today + 6 hours
  const departure2 = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const arrival2 = new Date(departure2.getTime() + 4 * 60 * 60 * 1000); // 4 hour journey

  const trip2 = await Trip.create({
    busId: sleeperBus._id,
    busNumber: sleeperBus.busNumber,
    busType: sleeperBus.type,
    source: 'Mumbai',
    destination: 'Pune',
    departureTime: departure2,
    arrivalTime: arrival2,
    fare: 750,
  });

  console.log('[Seeding] Trips created successfully!');
  console.log('----------------------------------------------------');
  console.log(`Operator Account:  operator@royaltravels.com / password123`);
  console.log(`Passenger Account: john@example.com / password123`);
  console.log(`Trip 1 (Seater):   ${trip1.source} -> ${trip1.destination} (ID: ${trip1._id})`);
  console.log(`Trip 2 (Sleeper):  ${trip2.source} -> ${trip2.destination} (ID: ${trip2._id})`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  console.log('[Seeding] Database disconnected.');
}

seed().catch((err) => {
  console.error('[Seeding] Fatal error during seeding:', err);
  process.exit(1);
});
