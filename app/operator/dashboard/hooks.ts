import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface KPIInfo {
  totalBookings: number;
  totalBookingsGrowth: number;
  activeRoutes: number;
  activeRoutesGrowth: number;
  totalRevenue: number;
  totalRevenueGrowth: number;
  occupancyRate: number;
  occupancyRateGrowth: number;
  avgRating: number;
  totalReviews: number;
  ratingGrowth: number;
}

export interface RouteStatus {
  tripId: string;
  routeName: string;
  busNumber: string;
  busType: string;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  passengersCount: number;
  delayStatus: 'Delayed' | 'On-time';
  coordinates: { latitude: number; longitude: number } | null;
}

export interface SalesTrend {
  _id: string; // date YYYY-MM-DD
  bookings: number;
  revenue: number;
  seats?: number;
}

export interface UpcomingSchedule {
  tripId: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  departureTime: string;
  capacity: number;
  occupiedSeats: number;
  status: string;
}

export interface FeedbackItem {
  passengerName: string;
  profileImage: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// 1. Hook for KPIs
export function useKPIs(params: { startDate: string; endDate: string; busType: string }) {
  const [data, setData] = useState<KPIInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const axiosParams: any = {};
      if (params.startDate) axiosParams.startDate = params.startDate;
      if (params.endDate) axiosParams.endDate = params.endDate;
      if (params.busType !== 'all') axiosParams.busType = params.busType;

      const res = await axios.get('/api/operator/dashboard/kpis', { params: axiosParams });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError('Failed to load KPIs.');
      }
    } catch (err: any) {
      console.error('[useKPIs] Fetch error:', err);
      setError(err?.response?.data?.message || 'Error fetching KPIs.');
    } finally {
      setLoading(false);
    }
  }, [params.startDate, params.endDate, params.busType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 2. Hook for Route Status (Live)
export function useRouteStatus() {
  const [data, setData] = useState<RouteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/operator/dashboard/route-status');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setError('Failed to load live route status.');
      }
    } catch (err: any) {
      console.error('[useRouteStatus] Fetch error:', err);
      setError(err?.response?.data?.message || 'Error fetching route status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 3. Hook for Sales Trends
export function useSalesTrends(params: { startDate: string; endDate: string; busType: string }) {
  const [data, setData] = useState<SalesTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const axiosParams: any = {};
      if (params.startDate) axiosParams.startDate = params.startDate;
      if (params.endDate) axiosParams.endDate = params.endDate;
      if (params.busType !== 'all') axiosParams.busType = params.busType;

      const res = await axios.get('/api/operator/dashboard/sales-trends', { params: axiosParams });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setError('Failed to load sales trends.');
      }
    } catch (err: any) {
      console.error('[useSalesTrends] Fetch error:', err);
      setError(err?.response?.data?.message || 'Error fetching sales trends.');
    } finally {
      setLoading(false);
    }
  }, [params.startDate, params.endDate, params.busType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 4. Hook for Upcoming Schedules
export function useUpcomingSchedules() {
  const [data, setData] = useState<UpcomingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/operator/dashboard/upcoming-schedules');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setError('Failed to load upcoming schedules.');
      }
    } catch (err: any) {
      console.error('[useUpcomingSchedules] Fetch error:', err);
      setError(err?.response?.data?.message || 'Error fetching upcoming schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 5. Hook for Feedback Reviews
export function useFeedback(params: { startDate: string; endDate: string }) {
  const [data, setData] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const axiosParams: any = {};
      if (params.startDate) axiosParams.startDate = params.startDate;
      if (params.endDate) axiosParams.endDate = params.endDate;

      const res = await axios.get('/api/operator/dashboard/feedback', { params: axiosParams });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setError('Failed to load reviews.');
      }
    } catch (err: any) {
      console.error('[useFeedback] Fetch error:', err);
      setError(err?.response?.data?.message || 'Error fetching feedback reviews.');
    } finally {
      setLoading(false);
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
