// src/hooks/useAutoSchedule.ts
import { useState, useCallback } from 'react';
import { autoSchedulingService } from '@/services/autoSchedulingService';
import { 
  AutoScheduleRequest, 
  AutoScheduleResponse, 
  ScheduleAlgorithm 
} from '@/app/types/auto-scheduling.types';

interface AlgorithmInfo {
  value: ScheduleAlgorithm;
  name: string;
  description: string;
  best_for: string[];
}

interface PeriodOption {
  value: string;
  name: string;
  description: string;
}

export const useAutoSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [algorithms, setAlgorithms] = useState<AlgorithmInfo[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);

  const generateSchedule = useCallback(async (data: AutoScheduleRequest): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoSchedulingService.generateSchedule(data);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to generate schedule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewSchedule = useCallback(async (data: Omit<AutoScheduleRequest, 'auto_create_shifts'>): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoSchedulingService.previewSchedule(data);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to preview schedule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fillOpenShifts = useCallback(async (period?: string): Promise<AutoScheduleResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const requestData: AutoScheduleRequest = {
        period: (period as any) || 'this_week',
        algorithm: 'balanced',
        auto_create_shifts: true,
      };
      
      const result = await autoSchedulingService.generateSchedule(requestData);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fill open shifts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlgorithms = useCallback(async () => {
    try {
      // Simple algorithms for frontend
      const algorithms: AlgorithmInfo[] = [
        {
          value: 'simple',
          name: 'Simple Assignment',
          description: 'Quickly fill shifts with first available staff',
          best_for: ['Quick schedules', 'Basic coverage needs'],
        },
        {
          value: 'balanced',
          name: 'Balanced Workload',
          description: 'Distribute shifts fairly among all staff',
          best_for: ['Fair schedules', 'Team morale', 'Long-term planning'],
        },
      ];

      const periods: PeriodOption[] = [
        { value: 'today', name: 'Today', description: 'Schedule for today only' },
        { value: 'tomorrow', name: 'Tomorrow', description: 'Schedule for tomorrow only' },
        { value: 'this_week', name: 'This Week', description: 'Schedule for Monday to Sunday' },
        { value: 'this_month', name: 'This Month', description: 'Schedule for the current month' },
        { value: 'custom', name: 'Custom Range', description: 'Select specific dates' },
      ];

      setAlgorithms(algorithms);
      setPeriods(periods);
    } catch (err: any) {
      console.error('Error fetching algorithms:', err);
      // Fallback to default algorithms
      const defaultAlgorithms: AlgorithmInfo[] = [
        {
          value: 'simple',
          name: 'Simple Assignment',
          description: 'Quickly fill shifts with first available staff',
          best_for: ['Quick schedules', 'Basic coverage needs'],
        },
        {
          value: 'balanced',
          name: 'Balanced Workload',
          description: 'Distribute shifts fairly among all staff',
          best_for: ['Fair schedules', 'Team morale', 'Long-term planning'],
        },
      ];
      setAlgorithms(defaultAlgorithms);
    }
  }, []);

  return {
    generateSchedule,
    previewSchedule,
    fillOpenShifts,
    loading,
    error,
    fetchAlgorithms,
    algorithms,
    periods,
  };
};