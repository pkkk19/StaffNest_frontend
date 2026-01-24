// src/services/autoSchedulingService.ts - UPDATED
import { autoGenerationAPI } from './api';
import { 
  AutoScheduleRequest, 
  AutoScheduleResponse, 
  AutoScheduleHistory,
  ScheduleAlgorithm,
  SchedulePeriod 
} from '@/app/types/auto-scheduling.types';

class AutoSchedulingService {
  /**
   * Generate a schedule using algorithms
   */
  async generateSchedule(data: AutoScheduleRequest): Promise<AutoScheduleResponse> {
    try {
      // Convert our frontend request to backend format
      const apiData = {
        period: data.period,
        start_date: data.start_date,
        end_date: data.end_date,
        algorithm: data.algorithm || 'balanced',
        auto_create_shifts: data.auto_create_shifts || false,
        notes: data.notes,
      };
      
      const response = await autoGenerationAPI.generateSchedule(apiData);
      return response.data;
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate schedule');
    }
  }

  /**
   * Preview schedule without creating shifts
   */
  async previewSchedule(data: Omit<AutoScheduleRequest, 'auto_create_shifts'>): Promise<AutoScheduleResponse> {
    try {
      const apiData = {
        period: data.period,
        start_date: data.start_date,
        end_date: data.end_date,
        algorithm: data.algorithm || 'balanced',
        auto_create_shifts: false,
        notes: data.notes,
      };
      
      const response = await autoGenerationAPI.previewSchedule(apiData);
      return response.data;
    } catch (error: any) {
      console.error('Error previewing schedule:', error);
      throw new Error(error.response?.data?.message || 'Failed to preview schedule');
    }
  }

  /**
   * Fill open shifts only
   */
  async fillOpenShifts(period: string = 'this_week'): Promise<AutoScheduleResponse> {
    try {
      const response = await autoGenerationAPI.fillOpenShifts(period);
      return response.data;
    } catch (error: any) {
      console.error('Error filling open shifts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fill open shifts');
    }
  }

  /**
   * Get available staff for a specific time slot
   */
  async getAvailableStaff(roleId: string, startTime: string, endTime: string): Promise<any[]> {
    try {
      const response = await autoGenerationAPI.getAvailableStaff(roleId, startTime, endTime);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available staff:', error);
      return [];
    }
  }

  /**
   * Get scheduling history
   */
  async getHistory(limit: number = 10, page: number = 1): Promise<{ data: AutoScheduleHistory[]; total: number }> {
    try {
      const response = await autoGenerationAPI.getScheduleHistory(limit, page);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching schedule history:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Get available algorithms from backend
   */
  async getAlgorithms(): Promise<Array<{value: string; name: string; description: string}>> {
    try {
      const response = await autoGenerationAPI.getAlgorithms();
      return response.data.algorithms || [];
    } catch (error: any) {
      console.error('Error fetching algorithms:', error);
      // Return default algorithms if API fails
      return [
        {
          value: 'simple',
          name: 'Simple Assignment',
          description: 'Quickly fill shifts with first available staff',
        },
        {
          value: 'balanced',
          name: 'Balanced Workload',
          description: 'Distribute shifts fairly among all staff',
        },
      ];
    }
  }

  /**
   * Get period options
   */
  async getPeriodOptions(): Promise<Array<{value: string; name: string; description: string}>> {
    try {
      const response = await autoGenerationAPI.getPeriodOptions();
      return response.data.periods || [];
    } catch (error: any) {
      console.error('Error fetching period options:', error);
      // Return default periods
      return [
        { value: 'today', name: 'Today', description: 'Schedule for today only' },
        { value: 'tomorrow', name: 'Tomorrow', description: 'Schedule for tomorrow only' },
        { value: 'this_week', name: 'This Week', description: 'Schedule for Monday to Sunday' },
        { value: 'this_month', name: 'This Month', description: 'Schedule for the current month' },
        { value: 'custom', name: 'Custom Range', description: 'Select specific dates' },
      ];
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date and time together
   */
  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Calculate shift duration in hours
   */
  calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get color for role
   */
  getRoleColor(roleId: string): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ];
    const hash = roleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Format algorithm name for display
   */
  formatAlgorithmName(algorithm: string): string {
    const names: Record<string, string> = {
      'simple': 'Simple Assignment',
      'balanced': 'Balanced Workload',
    };
    return names[algorithm] || algorithm;
  }

  /**
   * Format period name for display
   */
  formatPeriodName(period: string): string {
    const names: Record<string, string> = {
      'today': 'Today',
      'tomorrow': 'Tomorrow',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'custom': 'Custom Range',
    };
    return names[period] || period;
  }

  /**
   * Calculate coverage percentage
   */
  calculateCoverage(filledShifts: number, totalShifts: number): number {
    if (totalShifts === 0) return 100;
    return Math.round((filledShifts / totalShifts) * 100);
  }
}

export const autoSchedulingService = new AutoSchedulingService();
export default autoSchedulingService;