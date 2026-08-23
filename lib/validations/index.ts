import { z } from 'zod';

// MongoDB ObjectId Regex validation helper
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

// 1. User Registration Schema
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['passenger', 'operator'], {
    message: 'Role must be either passenger or operator',
  }),
});

// 2. User Login Schema
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 3. Booking Creation Schema
export const bookingSchema = z.object({
  tripId: objectIdSchema,
  seatNumbers: z.array(z.string().min(1)).min(1, 'At least one seat must be selected'),
  fromStop: z.string().trim().min(1, 'Boarding point is required'),
  toStop: z.string().trim().min(1, 'Dropping point is required'),
  passengerDetails: z.any().optional(),
});

// 4. Trip Search Schema (Query Params)
export const tripSearchSchema = z.object({
  source: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  busNumber: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater']).optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  sortBy: z.enum(['priceAsc', 'priceDesc', 'departure']).optional(),
  timeRange: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  departAfter: z.string().regex(/^\d{2}:\d{2}$/, 'departAfter must be in HH:MM format').optional(),
}).refine(
  (data) => {
    return (data.source && data.destination) || data.busNumber;
  },
  {
    message: 'Either (source and destination) or busNumber must be provided.',
    path: ['source'],
  }
);

// 4b. Wishlist Creation Schema
export const wishlistSchema = z.object({
  tripId: objectIdSchema,
});

// 4c. Review Submission Schema
export const reviewSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters').optional(),
});

// Export inferred TypeScript types for client-backend contract
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type TripSearchInput = z.infer<typeof tripSearchSchema>;
export type WishlistInput = z.infer<typeof wishlistSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;

// 5. User Profile Update Schema
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Gender must be male, female, or other',
  }).optional(),
  age: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120').optional()),
  phoneNumber: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional(),
  emergencyContactName: z.string().trim().min(2, 'Emergency contact name must be at least 2 characters').optional(),
  emergencyContactPhone: z.string().trim().regex(/^\d{10}$/, 'Emergency contact phone must be exactly 10 digits').optional(),
  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().min(6, 'New password must be at least 6 characters').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// 6. Bus Validation Schema
export const busSchema = z.object({
  routeId: z.string().min(1, 'Route reference is required'),
  busNumber: z.string().trim().min(3, 'Bus number must be at least 3 characters').toUpperCase(),
  type: z.enum(['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater'], {
    message: 'Bus type must be AC/Non-AC Sleeper or AC/Non-AC Seater',
  }),
  capacity: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Capacity must be at least 1').max(100, 'Capacity must be at most 100')),
  rows: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Rows must be at least 1').max(20, 'Rows must be at most 20')),
  cols: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Columns must be at least 1').max(10, 'Columns must be at most 10')),
  sleeperSeats: z
    .preprocess(
      (val) => {
        if (typeof val === 'string' && val.trim() !== '') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val || [];
      },
      z.array(z.string())
    )
    .optional(),
  amenities: z
    .preprocess(
      (val) => {
        if (typeof val === 'string' && val.trim() !== '') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val || [];
      },
      z.array(z.string())
    )
    .optional(),
});

export type BusInput = z.infer<typeof busSchema>;

// 7. Route Validation Schema
export const routeSchema = z.object({
  source: z.string().trim().min(2, 'Source name must be at least 2 characters'),
  destination: z.string().trim().min(2, 'Destination name must be at least 2 characters'),
  stops: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val || [];
    },
    z.array(
      z.object({
        stopName: z.string().trim().min(2, 'Stop name must be at least 2 characters'),
        arrivalOffsetMinutes: z
          .number({ message: 'Arrival offset must be a number' })
          .min(0, 'Arrival offset cannot be negative'),
        departureOffsetMinutes: z
          .number({ message: 'Departure offset must be a number' })
          .min(0, 'Departure offset cannot be negative'),
        sequence: z
          .number({ message: 'Sequence must be a number' })
          .min(1, 'Sequence must be at least 1'),
        fareFromPreviousStop: z
          .number({ message: 'Fare must be a number' })
          .min(0, 'Fare cannot be negative'),
      })
    )
  ).refine((stops) => stops.length >= 2, {
    message: 'A route must contain at least 2 stops (source and destination)',
  }),
  totalDistance: z.number().min(0, 'Distance cannot be negative').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
});

export type RouteInput = z.infer<typeof routeSchema>;
