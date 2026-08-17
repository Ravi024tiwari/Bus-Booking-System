import './lib/init-env'; // Must be first
import mongoose from 'mongoose';
import { holdSeat, releaseSeat } from './app/actions/seat';
import { User, Bus, Route, Trip, SeatState, Wishlist } from './models';

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/seatpulse';

async function testSegmentLocking() {
  console.log('[Test] Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);

  console.log('[Test] Cleaning existing test collections...');
  // Find or create test users
  const testPassenger = await User.findOneAndUpdate(
    { email: 'test_passenger@example.com' },
    { name: 'Test Passenger', role: 'passenger', password: 'hashedpassword123' },
    { upsert: true, new: true }
  );

  const testOperator = await User.findOneAndUpdate(
    { email: 'test_operator@example.com' },
    { name: 'Test Operator', role: 'operator', password: 'hashedpassword123', operatorApprovalStatus: 'APPROVED' },
    { upsert: true, new: true }
  );

  // Clean old test objects
  await Bus.deleteMany({ busNumber: 'TEST BUS 999' });
  await Route.deleteMany({ source: 'TestCityA', destination: 'TestCityC' });

  // 1. Create a Seater Bus
  const bus = await Bus.create({
    operatorId: testOperator._id,
    busNumber: 'TEST BUS 999',
    type: 'AC Seater',
    capacity: 10,
    rows: 5,
    cols: 2,
    sleeperSeats: []
  });

  // 2. Create a Route with 3 stops (A -> B -> C)
  const route = await Route.create({
    operatorId: testOperator._id,
    source: 'TestCityA',
    destination: 'TestCityC',
    stops: [
      { stopName: 'TestCityA', arrivalOffsetMinutes: 0, departureOffsetMinutes: 10, sequence: 1, fareFromPreviousStop: 0 },
      { stopName: 'TestCityB', arrivalOffsetMinutes: 60, departureOffsetMinutes: 70, sequence: 2, fareFromPreviousStop: 150 },
      { stopName: 'TestCityC', arrivalOffsetMinutes: 120, departureOffsetMinutes: 130, sequence: 3, fareFromPreviousStop: 250 }
    ]
  });

  // 3. Create a Scheduled Trip for today
  const departureTime = new Date();
  departureTime.setHours(departureTime.getHours() + 2);
  const arrivalTime = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000);

  const trip = await Trip.create({
    busId: bus._id,
    routeId: route._id,
    busNumber: bus.busNumber,
    busType: bus.type,
    source: 'TestCityA',
    destination: 'TestCityC',
    departureTime,
    arrivalTime,
    fare: 400,
    status: 'SCHEDULED'
  });

  // Clean old seat states for this trip
  await SeatState.deleteMany({ tripId: trip._id });

  console.log('[Test] Mock Trip created:', trip._id);

  const passengerId = testPassenger._id.toString();

  // Test Case A: Lock Seat 'S1' from A -> B (seq 1 -> 2)
  console.log('\n--- Test Case A: Hold Seat S1 from TestCityA to TestCityB (should succeed) ---');
  const resA = await holdSeat(trip._id.toString(), 'S1', passengerId, 'TestCityA', 'TestCityB');
  console.log('Result:', resA);
  if (!resA.success) throw new Error('Test Case A failed!');

  // Test Case B: Lock same Seat 'S1' from A -> C (seq 1 -> 3) (should fail due to overlap)
  console.log('\n--- Test Case B: Hold Seat S1 from TestCityA to TestCityC (should fail - overlap) ---');
  const resB = await holdSeat(trip._id.toString(), 'S1', passengerId, 'TestCityA', 'TestCityC');
  console.log('Result:', resB);
  if (resB.success) throw new Error('Test Case B failed (allowed overlap lock)!');

  // Test Case C: Lock same Seat 'S1' from B -> C (seq 2 -> 3) (should succeed - non-overlapping segment)
  console.log('\n--- Test Case C: Hold Seat S1 from TestCityB to TestCityC (should succeed - no overlap) ---');
  const resC = await holdSeat(trip._id.toString(), 'S1', passengerId, 'TestCityB', 'TestCityC');
  console.log('Result:', resC);
  if (!resC.success) throw new Error('Test Case C failed!');

  // Verify DB entries
  console.log('\n--- Verifying MongoDB SeatState records for S1 ---');
  const seats = await SeatState.find({ tripId: trip._id, seatNumber: 'S1' });
  console.log('Stored locked segments count:', seats.length);
  seats.forEach(s => {
    console.log(`- Seat: ${s.seatNumber}, Status: ${s.status}, Segment: Seq ${s.fromSequence} -> Seq ${s.toSequence}`);
  });
  if (seats.length !== 2) throw new Error('DB verification failed, expected exactly 2 locks!');

  // Test Case D: Release Segment A -> B
  console.log('\n--- Test Case D: Release Seat S1 segment A -> B (should succeed) ---');
  const resD = await releaseSeat(trip._id.toString(), 'S1', passengerId, 'TestCityA', 'TestCityB');
  console.log('Result:', resD);
  if (!resD.success) throw new Error('Test Case D failed!');

  const remainingSeats = await SeatState.find({ tripId: trip._id, seatNumber: 'S1' });
  console.log('Remaining locks count:', remainingSeats.length);
  if (remainingSeats.length !== 1) throw new Error('Expected 1 remaining lock!');

  // Test Case E: Test Wishlist schema
  console.log('\n--- Test Case E: Adding trip to Wishlist ---');
  await Wishlist.deleteMany({ passengerId: testPassenger._id });
  const wish = await Wishlist.create({
    passengerId: testPassenger._id,
    tripId: trip._id
  });
  console.log('Wishlist item created successfully:', wish._id);

  console.log('\n[Success] All segment locking tests passed!');
  
  // Clean up
  console.log('\n[Clean] Deleting test records...');
  await Bus.deleteOne({ _id: bus._id });
  await Route.deleteOne({ _id: route._id });
  await Trip.deleteOne({ _id: trip._id });
  await SeatState.deleteMany({ tripId: trip._id });
  await Wishlist.deleteMany({ passengerId: testPassenger._id });
  
  await mongoose.disconnect();
  console.log('[Test] Disconnected and finished.');
}

testSegmentLocking().catch(err => {
  console.error('[Error] Test execution failed:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
