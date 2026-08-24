import { configureStore, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// 1. User Slice
interface UserState {
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialUserState: UserState = {
  profile: {
    id: 'u1',
    name: 'Ravi Tiwari',
    email: 'ravi@example.com',
    role: 'passenger',
    avatar: '/images/rohit-avatar.jpg'
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser(state, action: PayloadAction<UserState['profile']>) {
      state.profile = action.payload;
    },
    clearUser(state) {
      state.profile = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

// 2. Bookings Slice
export interface Booking {
  id: string;
  seatNumbers: string[];
  amount: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED';
  createdAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  fromStop: string;
  toStop: string;
  tripDetails: {
    id: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    fare: number;
    busNumber: string;
    busType: string;
  } | null;
  
  // Backward compatibility fields for dashboard page
  source: string;
  destination: string;
  date: string;
  time: string;
  seat: string;
  busType: string;
  fare: number;
  pnr: string;
}

interface BookingsState {
  list: Booking[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialBookingsState: BookingsState = {
  list: [
    {
      id: 'b1',
      source: 'Raipur',
      destination: 'Pune',
      date: '18 Apr 2025',
      time: '09:00 PM',
      seat: 'A12',
      busType: 'AC Sleeper (2+1)',
      fare: 1150,
      pnr: 'TG98765432',
      status: 'CONFIRMED',
      seatNumbers: ['A12'],
      amount: 1150,
      createdAt: new Date('2025-04-18T21:00:00').toISOString(),
      fromStop: 'Raipur',
      toStop: 'Pune',
      tripDetails: {
        id: 't1',
        source: 'Raipur',
        destination: 'Pune',
        departureTime: new Date('2025-04-18T21:00:00').toISOString(),
        arrivalTime: new Date('2025-04-19T09:00:00').toISOString(),
        fare: 1150,
        busNumber: 'MH12QW1234',
        busType: 'AC Sleeper (2+1)'
      }
    },
    {
      id: 'b2',
      source: 'Nagpur',
      destination: 'Hyderabad',
      date: '10 Apr 2025',
      time: '07:30 PM',
      seat: 'B5',
      busType: 'AC Sleeper (2+1)',
      fare: 950,
      pnr: 'TG98765433',
      status: 'CONFIRMED',
      seatNumbers: ['B5'],
      amount: 950,
      createdAt: new Date('2025-04-10T19:30:00').toISOString(),
      fromStop: 'Nagpur',
      toStop: 'Hyderabad',
      tripDetails: {
        id: 't2',
        source: 'Nagpur',
        destination: 'Hyderabad',
        departureTime: new Date('2025-04-10T19:30:00').toISOString(),
        arrivalTime: new Date('2025-04-11T06:30:00').toISOString(),
        fare: 950,
        busNumber: 'AP09TY8877',
        busType: 'AC Sleeper (2+1)'
      }
    },
    {
      id: 'b3',
      source: 'Bhilai',
      destination: 'Goa',
      date: '02 Apr 2025',
      time: '06:00 PM',
      seat: 'C1',
      busType: 'Non-AC Sleeper',
      fare: 1850,
      pnr: 'TG98765434',
      status: 'CONFIRMED',
      seatNumbers: ['C1'],
      amount: 1850,
      createdAt: new Date('2025-04-02T18:00:00').toISOString(),
      fromStop: 'Bhilai',
      toStop: 'Goa',
      tripDetails: {
        id: 't3',
        source: 'Bhilai',
        destination: 'Goa',
        departureTime: new Date('2025-04-02T18:00:00').toISOString(),
        arrivalTime: new Date('2025-04-03T10:00:00').toISOString(),
        fare: 1850,
        busNumber: 'GA03ZZ4321',
        busType: 'Non-AC Sleeper'
      }
    },
  ],
  loading: false,
  error: null,
  page: 1,
  hasMore: true
};

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMyBookings',
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/bookings/my?page=${page}&limit=${limit}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch bookings.');
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: initialBookingsState,
  reducers: {
    setBookings(state, action: PayloadAction<Booking[]>) {
      state.list = action.payload;
    },
    addBooking(state, action: PayloadAction<Booking>) {
      state.list.unshift(action.payload);
    },
    setBookingsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setBookingsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        const { data, pagination } = action.payload;
        
        // Map fields to verify backward compatibility
        const mapped = data.map((b: any) => {
          const trip = b.tripDetails;
          const formattedDate = trip ? new Date(trip.departureTime).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          }) : '';
          const formattedTime = trip ? new Date(trip.departureTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          }) : '';

          return {
            ...b,
            source: trip?.source || b.fromStop,
            destination: trip?.destination || b.toStop,
            date: formattedDate,
            time: formattedTime,
            seat: b.seatNumbers.join(', '),
            busType: trip?.busType || 'Express',
            fare: b.amount,
            pnr: b.razorpayOrderId || b.id.substring(0, 10).toUpperCase()
          };
        });

        if (pagination.page === 1) {
          state.list = mapped;
        } else {
          const existingIds = new Set(state.list.map(b => b.id));
          const newItems = mapped.filter((b: any) => !existingIds.has(b.id));
          state.list = [...state.list, ...newItems];
        }
        state.page = pagination.page;
        state.hasMore = pagination.hasMore;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch bookings';
      });
  }
});

// 3. Trips Slice (Operational journeys)
export interface TripBooking {
  id: string;
  seatNumbers: string[];
  amount: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED';
  createdAt: string;
  fromStop: string;
  toStop: string;
  fromSequence: number;
  toSequence: number;
  tripDetails: {
    id: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    fare: number;
    status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
    busNumber: string;
    busType: string;
  } | null;
}

interface TripsState {
  upcoming: TripBooking[];
  today: TripBooking[];
  history: TripBooking[];
  loading: {
    upcoming: boolean;
    today: boolean;
    history: boolean;
  };
  error: string | null;
}

const initialTripsState: TripsState = {
  upcoming: [],
  today: [],
  history: [],
  loading: {
    upcoming: false,
    today: false,
    history: false,
  },
  error: null,
};

export const fetchMyTrips = createAsyncThunk(
  'trips/fetchMyTrips',
  async ({ tab }: { tab: 'upcoming' | 'today' | 'history' }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/trips/my?tab=${tab}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch trips.');
      }
      return { tab, data: data.data };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState: initialTripsState,
  reducers: {
    clearTrips(state) {
      state.upcoming = [];
      state.today = [];
      state.history = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTrips.pending, (state, action) => {
        const tab = action.meta.arg.tab;
        state.loading[tab] = true;
        state.error = null;
      })
      .addCase(fetchMyTrips.fulfilled, (state, action) => {
        const { tab, data } = action.payload;
        state.loading[tab] = false;
        state[tab] = data;
      })
      .addCase(fetchMyTrips.rejected, (state, action) => {
        const tab = action.meta.arg.tab;
        state.loading[tab] = false;
        state.error = action.payload as string || 'Failed to fetch trips';
      });
  }
});

// 4. UI Slice
interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialUiState: UiState = {
  sidebarOpen: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme(state, action: PayloadAction<UiState['theme']>) {
      state.theme = action.payload;
    },
  },
});

// Export actions
export const { setUser, clearUser, setLoading, setError } = userSlice.actions;
export const { setBookings, addBooking, setBookingsLoading, setBookingsError } = bookingsSlice.actions;
export const { clearTrips } = tripsSlice.actions;
export const { toggleSidebar, setSidebarOpen, toggleTheme, setTheme } = uiSlice.actions;

// Configure Store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    bookings: bookingsSlice.reducer,
    trips: tripsSlice.reducer,
    ui: uiSlice.reducer,
  },
});

// Redux Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
