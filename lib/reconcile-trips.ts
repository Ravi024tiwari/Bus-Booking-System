import { Trip } from '@/models';

/**
 * Production-grade auto-cancellation and lifecycle reconciliation for trips.
 * Automatically marks un-started or abandoned trips as CANCELLED when their departure
 * time has elapsed by more than the grace window.
 */
export async function reconcileStaleTrips(): Promise<void> {
  try {
    const now = new Date();
    
    // Grace periods:
    // 1. If trip was 'SCHEDULED' and 3 hours have elapsed past departureTime without starting -> CANCELLED
    const scheduledGraceCutoff = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    // 2. If trip was 'BOARDING' and 5 hours have elapsed past departureTime without departing -> CANCELLED
    const boardingGraceCutoff = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const staleScheduled = await Trip.updateMany(
      {
        status: 'SCHEDULED',
        departureTime: { $lt: scheduledGraceCutoff }
      },
      {
        $set: { status: 'CANCELLED' }
      }
    );

    const staleBoarding = await Trip.updateMany(
      {
        status: 'BOARDING',
        departureTime: { $lt: boardingGraceCutoff }
      },
      {
        $set: { status: 'CANCELLED' }
      }
    );

    if (staleScheduled.modifiedCount > 0 || staleBoarding.modifiedCount > 0) {
      console.log(`[Trip Reconciler] Auto-cancelled ${staleScheduled.modifiedCount} stale scheduled and ${staleBoarding.modifiedCount} stale boarding trips.`);
    }
  } catch (err) {
    console.error('[Trip Reconciler] Error during reconciliation:', err);
  }
}
