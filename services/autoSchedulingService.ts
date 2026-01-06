// src/services/autoSchedulingService.ts
import { autoGenerationAPI } from './api';
import { 
  AutoScheduleRequest, 
  AutoScheduleResponse, 
  AutoScheduleHistory,
  ScheduleTemplate,
  StaffAvailability 
} from '@/app/types/auto-scheduling.types';

// Define a strict type for valid algorithm values
type AlgorithmValue = 'fair_share' | 'round_robin' | 'coverage_first' | 'preference_based';

// Create a type that matches what the API expects
interface APIAutoScheduleRequest {
  period: 'day' | 'week' | 'month' | 'custom';
  start_date?: string;
  end_date?: string;
  fill_open_only: boolean;
  consider_preferences: boolean;
  ensure_legal_compliance: boolean;
  optimize_existing: boolean;
  auto_create_shifts: boolean;
  algorithm?: AlgorithmValue;
  balance_workload?: boolean;
  max_shifts_per_staff?: number;
  excluded_staff_ids?: string[];
  notes?: string;
}

class AutoSchedulingService {
  /**
   * Generate a schedule using algorithms
   */
  async generateSchedule(data: AutoScheduleRequest): Promise<AutoScheduleResponse> {
    try {
      // Convert the incoming data to match API expectations
      const apiData: APIAutoScheduleRequest = {
        ...data,
        // Ensure algorithm is one of the valid values or undefined
        algorithm: this.validateAlgorithm(data.algorithm)
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
      // Convert the incoming data to match API expectations
      const apiData: APIAutoScheduleRequest = {
        ...data as AutoScheduleRequest,
        auto_create_shifts: false,
        algorithm: this.validateAlgorithm(data.algorithm)
      };
      
      const response = await autoGenerationAPI.previewSchedule(apiData);
      return response.data;
    } catch (error: any) {
      console.error('Error previewing schedule:', error);
      throw new Error(error.response?.data?.message || 'Failed to preview schedule');
    }
  }

  /**
   * Validate and convert algorithm string to valid type
   */
  private validateAlgorithm(algorithm?: string): AlgorithmValue | undefined {
    if (!algorithm) return undefined;
    
    const validAlgorithms: AlgorithmValue[] = ['fair_share', 'round_robin', 'coverage_first', 'preference_based'];
    
    if (validAlgorithms.includes(algorithm as AlgorithmValue)) {
      return algorithm as AlgorithmValue;
    }
    
    // Default to 'fair_share' if invalid algorithm provided
    console.warn(`Invalid algorithm "${algorithm}", defaulting to "fair_share"`);
    return 'fair_share';
  }

  /**
   * Fill open shifts only
   */
  async fillOpenShifts(): Promise<AutoScheduleResponse> {
    try {
      const response = await autoGenerationAPI.fillOpenShifts();
      return response.data;
    } catch (error: any) {
      console.error('Error filling open shifts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fill open shifts');
    }
  }

  /**
   * Get available staff for a specific time slot
   */
  async getAvailableStaff(roleId: string, startTime: string, endTime: string): Promise<StaffAvailability[]> {
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
   * Get available algorithms
   */
  async getAlgorithms(): Promise<Array<{value: AlgorithmValue, label: string, description: string}>> {
    try {
      const response = await autoGenerationAPI.getAlgorithms();
      
      // Filter and validate the algorithms from the API
      const validAlgorithms: AlgorithmValue[] = ['fair_share', 'round_robin', 'coverage_first', 'preference_based'];
      const algorithms = response.data.algorithms || [];
      
      return algorithms
        .filter((algo: any) => validAlgorithms.includes(algo.value))
        .map((algo: any) => ({
          ...algo,
          value: algo.value as AlgorithmValue
        }));
    } catch (error: any) {
      console.error('Error fetching algorithms:', error);
      return [];
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
      day: 'numeric'
    });
  }

  /**
   * Format time for display
   */
  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculate shift duration in hours
   */
  calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
  }

  /**
   * Get color for role
   */
  getRoleColor(roleId: string): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    const hash = roleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Format algorithm name for display
   */
  formatAlgorithmName(algorithm: string): string {
    const names: Record<string, string> = {
      'round_robin': 'Round Robin',
      'fair_share': 'Fair Share',
      'coverage_first': 'Coverage First',
      'preference_based': 'Preference Based'
    };
    return names[algorithm] || algorithm;
  }
}

export const autoSchedulingService = new AutoSchedulingService();
export default autoSchedulingService;