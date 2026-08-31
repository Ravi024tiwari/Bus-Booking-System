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
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser(state, action: PayloadAction<UserState['profile']>) {
      state.profile = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('user_profile', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('user_profile');
        }
      }
    },
    clearUser(state) {
      state.profile = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_profile');
      }
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
  discountAmount?: number;
  discountedSeatsCount?: number;
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
  list: [],
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
  myRating?: number | null;
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
    averageRating?: number;
    totalReviews?: number;
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
// 5. Admin Bookings Slice (Operator Trips)
export interface AdminTrip {
  id: string;
  busNumber: string;
  busType: string;
  source: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
  capacity: number;
  seatsBooked: number;
  averageRating?: number;
  totalReviews?: number;
  operatorDetails: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
  } | null;
  viaStops?: string[];
  offerPercentage?: number;
  busImages?: string[];
  formattedDate?: string;
  formattedTime?: string;
}

interface TabCache {
  list: AdminTrip[];
  page: number;
  hasMore: boolean;
}

interface AdminBookingsState {
  all: TabCache;
  today: TabCache;
  upcoming: TabCache;
  previous: TabCache;
  loading: boolean;
  error: string | null;
  activeTab: 'all' | 'today' | 'upcoming' | 'previous';
}

const initialAdminBookingsState: AdminBookingsState = {
  all: { list: [], page: 1, hasMore: true },
  today: { list: [], page: 1, hasMore: true },
  upcoming: { list: [], page: 1, hasMore: true },
  previous: { list: [], page: 1, hasMore: true },
  loading: false,
  error: null,
  activeTab: 'all',
};

export const fetchAdminBookings = createAsyncThunk(
  'adminBookings/fetchAdminBookings',
  async (
    { page, limit, filter }: { page: number; limit: number; filter: 'all' | 'today' | 'upcoming' | 'previous' },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/admin/bookings?page=${page}&limit=${limit}&filter=${filter}`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch admin bookings.');
      }
      return { filter, page, data: data.data, pagination: data.pagination };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const adminBookingsSlice = createSlice({
  name: 'adminBookings',
  initialState: initialAdminBookingsState,
  reducers: {
    setActiveTab(state, action: PayloadAction<AdminBookingsState['activeTab']>) {
      state.activeTab = action.payload;
    },
    clearAdminCache(state) {
      state.all = { list: [], page: 1, hasMore: true };
      state.today = { list: [], page: 1, hasMore: true };
      state.upcoming = { list: [], page: 1, hasMore: true };
      state.previous = { list: [], page: 1, hasMore: true };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.loading = false;
        const { filter, page, data, pagination } = action.payload;

        // Format dates and time for client presentation
        const mapped = data.map((t: any) => {
          const formattedDate = new Date(t.departureTime).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
          const formattedTime = new Date(t.departureTime).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          });

          return {
            ...t,
            formattedDate,
            formattedTime,
          };
        });

        const tab = filter as 'all' | 'today' | 'upcoming' | 'previous';

        if (page === 1) {
          state[tab].list = mapped;
        } else {
          const existingIds = new Set(state[tab].list.map((t: any) => t.id));
          const newItems = mapped.filter((t: any) => !existingIds.has(t.id));
          state[tab].list = [...state[tab].list, ...newItems];
        }

        state[tab].page = pagination.page;
        state[tab].hasMore = pagination.hasMore;
      })
      .addCase(fetchAdminBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch admin bookings';
      });
  }
});


// 6. Rewards Slice
interface RewardsState {
  list: Booking[];
  totalSavings: number;
  claimedCount: number;
  loading: boolean;
  error: string | null;
}

const initialRewardsState: RewardsState = {
  list: [],
  totalSavings: 0,
  claimedCount: 0,
  loading: false,
  error: null
};

export const fetchMyRewards = createAsyncThunk(
  'rewards/fetchMyRewards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/bookings/rewards');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch rewards.');
      }
      return data.data; // returns { rewardsList, totalSavings, claimedCount }
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState: initialRewardsState,
  reducers: {
    clearRewards(state) {
      state.list = [];
      state.totalSavings = 0;
      state.claimedCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRewards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.rewardsList;
        state.totalSavings = action.payload.totalSavings;
        state.claimedCount = action.payload.claimedCount;
      })
      .addCase(fetchMyRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch rewards';
      });
  }
});

// 7. Customer Dashboard Slice
export interface CustomerKPIs {
  completedTrips: number;
  completedThisMonth: number;
  upcomingTrips: number;
  nextTripDate: string | null;
  spentThisMonth: number;
  spentLastMonth: number;
  spentChangePercent: number | null;
  rewardPoints: number;
  totalSpent: number;
  totalSavings: number;
}

export interface CustomerNextTrip {
  id: string;
  orderId: string;
  source: string;
  destination: string;
  fromStop: string;
  toStop: string;
  departureTime: string;
  arrivalTime: string;
  formattedDate: string;
  formattedTime: string;
  date: string;
  time: string;
  seatNumbers: string[];
  seatsFormatted: string;
  amount: number;
  fare: number;
  pnr: string;
  busNumber: string;
  busType: string;
  busImage: string;
  operatorName: string;
  status: string;
}

export interface PopularRouteItem {
  source: string;
  destination: string;
  fare: string;
  image: string;
}

interface CustomerDashboardState {
  kpis: CustomerKPIs;
  nextTrip: CustomerNextTrip | null;
  popularRoutes: PopularRouteItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialCustomerDashboardState: CustomerDashboardState = {
  kpis: {
    completedTrips: 0,
    completedThisMonth: 0,
    upcomingTrips: 0,
    nextTripDate: null,
    spentThisMonth: 0,
    spentLastMonth: 0,
    spentChangePercent: null,
    rewardPoints: 0,
    totalSpent: 0,
    totalSavings: 0,
  },
  nextTrip: null,
  popularRoutes: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchCustomerDashboard = createAsyncThunk(
  'customerDashboard/fetchCustomerDashboard',
  async (forceRefresh: boolean | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      if (!forceRefresh && state.customerDashboard?.lastFetched && Date.now() - state.customerDashboard.lastFetched < 30000) {
        return null;
      }

      const response = await fetch('/api/customer/dashboard');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch customer dashboard data.');
      }
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const customerDashboardSlice = createSlice({
  name: 'customerDashboard',
  initialState: initialCustomerDashboardState,
  reducers: {
    setCustomerDashboardData(state, action: PayloadAction<{ kpis: CustomerKPIs; nextTrip: CustomerNextTrip | null; popularRoutes: PopularRouteItem[] }>) {
      state.kpis = action.payload.kpis;
      state.nextTrip = action.payload.nextTrip;
      state.popularRoutes = action.payload.popularRoutes;
      state.lastFetched = Date.now();
      state.loading = false;
      state.error = null;
    },
    clearCustomerDashboard(state) {
      state.kpis = initialCustomerDashboardState.kpis;
      state.nextTrip = null;
      state.popularRoutes = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerDashboard.pending, (state) => {
        if (!state.lastFetched) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchCustomerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.kpis = action.payload.kpis;
          state.nextTrip = action.payload.nextTrip;
          state.popularRoutes = action.payload.popularRoutes;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchCustomerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch customer dashboard';
      });
  },
});

// Export actions
export const { setUser, clearUser, setLoading, setError } = userSlice.actions;
export const { setBookings, addBooking, setBookingsLoading, setBookingsError } = bookingsSlice.actions;
export const { clearTrips } = tripsSlice.actions;
export const { toggleSidebar, setSidebarOpen, toggleTheme, setTheme } = uiSlice.actions;
export const { setActiveTab, clearAdminCache } = adminBookingsSlice.actions;
export const { clearRewards } = rewardsSlice.actions;
export const { setCustomerDashboardData, clearCustomerDashboard } = customerDashboardSlice.actions;

// Configure Store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    bookings: bookingsSlice.reducer,
    trips: tripsSlice.reducer,
    ui: uiSlice.reducer,
    adminBookings: adminBookingsSlice.reducer,
    rewards: rewardsSlice.reducer,
    customerDashboard: customerDashboardSlice.reducer,
  },
});

// Redux Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

