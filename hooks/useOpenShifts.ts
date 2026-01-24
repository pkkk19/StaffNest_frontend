// hooks/useOpenShifts.ts - FULLY FIXED VERSION
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
      
      console.log('🚀 [useOpenShifts] Starting to fetch open shifts...');
      console.log('📅 [useOpenShifts] Current date:', new Date().toISOString());
      
      // Calculate date range: from today to next 90 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const next90Days = new Date(today);
      next90Days.setDate(today.getDate() + 90);
      next90Days.setHours(23, 59, 59, 999);
      
      // Format dates for API (YYYY-MM-DD)
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDate = formatDate(today);
      const endDate = formatDate(next90Days);
      
      console.log('📅 [useOpenShifts] Fetching from:', startDate, 'to', endDate);
      
      // Try to fetch ALL shifts without date filter first
      const response = await shiftsAPI.getShifts({
        start_date: startDate,
        end_date: endDate
      });
      
      console.log('📦 [useOpenShifts] Raw API response:', {
        dataLength: response.data?.length || 0,
        hasData: !!response.data,
        isArray: Array.isArray(response.data)
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.log('⚠️ [useOpenShifts] No valid data returned from API');
        setOpenShifts([]);
        setLoading(false);
        return;
      }
      
      console.log(`✅ [useOpenShifts] Received ${response.data.length} total shifts`);
      
      // Log first few shifts for debugging
      response.data.slice(0, 5).forEach((shift: any, index: number) => {
        console.log(`📝 [useOpenShifts] Shift ${index + 1}:`, {
          id: shift._id,
          title: shift.title,
          type: shift.type,
          status: shift.status,
          user_id: shift.user_id,
          start_time: shift.start_time,
          end_time: shift.end_time
        });
      });
      
      // Filter for open shifts - FIXED CRITERIA
      const openShiftsOnly: Shift[] = [];
      
      response.data.forEach((shift: any) => {
        console.log(`🔍 [useOpenShifts] Checking shift "${shift.title}":`, {
          type: shift.type,
          status: shift.status,
          user_id: shift.user_id ? 'HAS USER' : 'NO USER',
          start_time: shift.start_time
        });
        
        // CRITERIA 1: Must be type 'open'
        if (shift.type !== 'open') {
          console.log(`   ❌ [useOpenShifts] Not open shift (type: ${shift.type})`);
          return;
        }
        
        // CRITERIA 2: Must have no user assigned OR user_id is null/empty
        if (shift.user_id) {
          // Check if user_id is actually a valid user object/id
          if (typeof shift.user_id === 'object' && shift.user_id._id) {
            console.log(`   ❌ [useOpenShifts] Has assigned user:`, shift.user_id._id);
            return;
          }
          if (typeof shift.user_id === 'string' && shift.user_id.trim() !== '') {
            console.log(`   ❌ [useOpenShifts] Has assigned user ID:`, shift.user_id);
            return;
          }
        }
        
        // CRITERIA 3: Status must be 'open' OR 'scheduled'
        if (!['open', 'scheduled'].includes(shift.status)) {
          console.log(`   ❌ [useOpenShifts] Invalid status: ${shift.status}`);
          return;
        }
        
        // CRITERIA 4: Must be in the future (or today)
        try {
          const shiftDate = new Date(shift.start_time);
          const now = new Date();
          
          if (shiftDate < now) {
            console.log(`   ❌ [useOpenShifts] Shift is in the past:`, shiftDate);
            return;
          }
          
          console.log(`   ✅ [useOpenShifts] Valid open shift!`);
          openShiftsOnly.push(shift);
          
        } catch (dateError) {
          console.log(`   ⚠️ [useOpenShifts] Error parsing shift date:`, dateError);
        }
      });
      
      console.log(`🎯 [useOpenShifts] Found ${openShiftsOnly.length} valid open shifts`);
      
      // Log all open shifts for debugging
      openShiftsOnly.forEach((shift, index) => {
        console.log(`📋 [useOpenShifts] Open Shift ${index + 1}:`, {
          id: shift._id,
          title: shift.title,
          start_time: shift.start_time,
          end_time: shift.end_time,
          location: shift.location,
          type: shift.type,
          status: shift.status
        });
      });
      
      setOpenShifts(openShiftsOnly);
      
    } catch (err: any) {
      console.error('❌ [useOpenShifts] Error fetching shifts:', err);
      
      let errorMessage = 'Failed to fetch shifts';
      if (err.response?.data?.message) {
        errorMessage = `API Error: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      console.error('❌ [useOpenShifts] Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      
      setError(errorMessage);
      setOpenShifts([]);
    } finally {
      console.log('🏁 [useOpenShifts] Fetch completed');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 [useOpenShifts] useEffect triggered');
    fetchOpenShifts();
    
    // Cleanup
    return () => {
      console.log('🧹 [useOpenShifts] Cleaning up');
    };
  }, [fetchOpenShifts]);

  const refetch = useCallback(() => {
    console.log('🔃 [useOpenShifts] Manual refetch triggered');
    fetchOpenShifts();
  }, [fetchOpenShifts]);

  return {
    openShifts,
    loading,
    error,
    refetch
  };
}