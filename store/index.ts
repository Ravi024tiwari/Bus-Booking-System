import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  source: string;
  destination: string;
  date: string;
  time: string;
  seat: string;
  busType: string;
  fare: number;
  pnr: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface BookingsState {
  list: Booking[];
  loading: boolean;
  error: string | null;
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
      status: 'completed',
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
      status: 'completed',
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
      status: 'completed',
    },
  ],
  loading: false,
  error: null,
};

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
});

// 3. UI Slice
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
export const { toggleSidebar, setSidebarOpen, toggleTheme, setTheme } = uiSlice.actions;

// Configure Store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    bookings: bookingsSlice.reducer,
    ui: uiSlice.reducer,
  },
});

// Redux Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
