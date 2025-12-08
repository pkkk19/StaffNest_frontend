// hooks/useOpenShifts.ts
import { useState, useCallback, useEffect } from 'react';
import { Shift } from '@/app/types/rota.types';
import { shiftsAPI } from '@/services/api';

export function useOpenShifts() {
  const [openShifts, setOpenShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ALL shifts, then filter for type 'open'
      const response = await shiftsAPI.getShifts({
        start_date: new Date().toISOString().split('T')[0], // Today
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next 30 days
      });
      
      console.log('All shifts fetched:', response.data?.length || 0);
      
      // Filter for open shifts AND status 'scheduled'
      const openShiftsOnly = (response.data || []).filter((shift: Shift) => 
        shift.type === 'open' && shift.status === 'scheduled'
      );
      
      console.log('Open shifts found:', openShiftsOnly.length);
      setOpenShifts(openShiftsOnly);
      
    } catch (err: any) {
      console.error('Error fetching shifts:', err);
      
      let errorMessage = 'Failed to fetch shifts';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setOpenShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenShifts();
  }, [fetchOpenShifts]);

  const refetch = useCallback(() => {
    fetchOpenShifts();
  }, [fetchOpenShifts]);

  return {
    openShifts,
    loading,
    error,
    refetch
  };
}