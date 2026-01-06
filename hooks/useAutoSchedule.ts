// Create src/hooks/useAutoSchedule.ts
import { useState, useCallback } from 'react';
import { autoSchedulingService } from '@/services/autoSchedulingService';
import { AutoScheduleRequest, AutoScheduleResponse, AutoScheduleHistory } from '@/app/types/auto-scheduling.types';
import { useAuth } from '@/contexts/AuthContext';

export function useAutoSchedule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSchedule, setGeneratedSchedule] = useState<AutoScheduleResponse | null>(null);
  const [history, setHistory] = useState<AutoScheduleHistory[]>([]);
  const [algorithms, setAlgorithms] = useState<Array<{value: string, label: string, description: string}>>([]);
  const { user } = useAuth();

  /**
   * Generate a schedule using algorithms
   */
  const generateSchedule = useCallback(async (request: AutoScheduleRequest): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await autoSchedulingService.generateSchedule(request);
      setGeneratedSchedule(response);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Preview a schedule without creating shifts
   */
  const previewSchedule = useCallback(async (request: Omit<AutoScheduleRequest, 'auto_create_shifts'>): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await autoSchedulingService.previewSchedule(request);
      setGeneratedSchedule(response);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fill open shifts only
   */
  const fillOpenShifts = useCallback(async (): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await autoSchedulingService.fillOpenShifts();
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch schedule history
   */
  const fetchHistory = useCallback(async (limit: number = 10, page: number = 1) => {
    if (!user?.company_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await autoSchedulingService.getHistory(limit, page);
      setHistory(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.company_id]);

  /**
   * Fetch available algorithms
   */
  const fetchAlgorithms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const algorithmsData = await autoSchedulingService.getAlgorithms();
      setAlgorithms(algorithmsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get available staff for a time slot
   */
  const getAvailableStaff = useCallback(async (roleId: string, startTime: string, endTime: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await autoSchedulingService.getAvailableStaff(roleId, startTime, endTime);
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear generated schedule
   */
  const clearGeneratedSchedule = useCallback(() => {
    setGeneratedSchedule(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    generatedSchedule,
    history,
    algorithms,
    
    // Actions
    generateSchedule,
    previewSchedule,
    fillOpenShifts,
    fetchHistory,
    fetchAlgorithms,
    getAvailableStaff,
    clearGeneratedSchedule,
    
    // Formatting helpers
    formatDate: autoSchedulingService.formatDate,
    formatTime: autoSchedulingService.formatTime,
    calculateDuration: autoSchedulingService.calculateDuration,
    getRoleColor: autoSchedulingService.getRoleColor,
    formatAlgorithmName: autoSchedulingService.formatAlgorithmName,
  };
}