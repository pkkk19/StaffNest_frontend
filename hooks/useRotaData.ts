import { useState, useEffect, useCallback, useRef } from 'react';
import { Shift, ShiftFilters, CreateShiftData, UpdateShiftData } from '@/app/types/rota.types';
import { useAuth } from '@/contexts/AuthContext';
import { shiftsAPI } from '@/services/api';

export function useRotaData(filters: ShiftFilters = {}) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isFetching = useRef(false);
  const lastFetchRef = useRef<string>('');

  const formatDateForAPI = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  const fetchShifts = useCallback(async () => {
    if (isFetching.current) return;
    
    const startDate = filters.start_date || new Date();
    let endDate = filters.end_date;
    
    if (!endDate) {
      const defaultEndDate = new Date(startDate);
      defaultEndDate.setDate(defaultEndDate.getDate() + 6);
      endDate = defaultEndDate;
    }

    // Build API parameters
    const apiParams: any = {
      start_date: formatDateForAPI(startDate),
      end_date: formatDateForAPI(endDate),
    };

    // Only add user_id if explicitly provided
    if (filters.user_id) {
      apiParams.user_id = filters.user_id;
    }

    // Add status filter if provided
    if (filters.status) {
      apiParams.status = filters.status;
    }

    // Add type filter if provided
    if (filters.type) {
      apiParams.type = filters.type;
    }

    // Create a signature for this fetch to prevent duplicate calls
    const fetchSignature = JSON.stringify(apiParams);
    if (lastFetchRef.current === fetchSignature && shifts.length > 0) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Fetching shifts with params:', apiParams);
      
      const response = await shiftsAPI.getShifts(apiParams);
      setShifts(response.data);
      lastFetchRef.current = fetchSignature;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch shifts';
      setError(errorMessage);
      console.error('Error fetching shifts:', err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isFetching.current = false;
      }, 100);
    }
  }, [filters.start_date, filters.end_date, filters.user_id, filters.status, filters.type, shifts.length]);

  // Use a debounced effect for initial fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShifts();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchShifts]);

  // Create shift method
  const createShift = async (shiftData: Omit<CreateShiftData, 'company_id'>) => {
    try {
      const response = await shiftsAPI.createShift(shiftData);
      await fetchShifts();
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create shift';
      throw new Error(errorMessage);
    }
  };

  const updateShift = async (id: string, shiftData: UpdateShiftData) => {
    try {
      const response = await shiftsAPI.updateShift(id, shiftData);
      await fetchShifts();
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update shift';
      throw new Error(errorMessage);
    }
  };

  const deleteShift = async (id: string) => {
    try {
      await shiftsAPI.deleteShift(id);
      await fetchShifts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete shift';
      throw new Error(errorMessage);
    }
  };

  const deleteShiftsBulk = useCallback(async (deleteDto: {
    start_date?: string | Date;
    end_date?: string | Date;
    user_id?: string;
    status?: string;
    type?: string;
    day?: string;
    month?: string;
    week?: string;
    force?: boolean;
  }) => {
    try {
      // Convert Date objects to ISO strings if needed
      const formattedDto = {
        ...deleteDto,
        start_date: deleteDto.start_date 
          ? new Date(deleteDto.start_date).toISOString()
          : undefined,
        end_date: deleteDto.end_date
          ? new Date(deleteDto.end_date).toISOString()
          : undefined,
      };

      const response = await shiftsAPI.deleteShiftsBulk(formattedDto);
      return response.data;
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      throw error.response?.data || error.message;
    }
  }, []);

  const clockIn = async (id: string, location?: { latitude: number; longitude: number }) => {
    try {
      const response = await shiftsAPI.clockIn(id, location);
      await fetchShifts();
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clock in';
      throw new Error(errorMessage);
    }
  };

  const clockOut = async (id: string, location?: { latitude: number; longitude: number }) => {
    try {
      const response = await shiftsAPI.clockOut(id, location);
      await fetchShifts();
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to clock out';
      throw new Error(errorMessage);
    }
  };

  const refetch = () => {
    lastFetchRef.current = '';
    fetchShifts();
  };

  return { 
    shifts, 
    loading, 
    error, 
    refetch,
    createShift,
    updateShift,
    deleteShift,
    clockIn,
    clockOut,
    deleteShiftsBulk,
  };
}

// Separate hook for open shifts
export function useOpenShifts() {
  const [openShifts, setOpenShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shiftsAPI.getOpenShifts();
      setOpenShifts(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch open shifts';
      setError(errorMessage);
      console.error('Error fetching open shifts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenShifts();
  }, [fetchOpenShifts]);

  const refetch = () => {
    fetchOpenShifts();
  };

  return {
    openShifts,
    loading,
    error,
    refetch
  };
}