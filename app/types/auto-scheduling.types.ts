// src/app/types/auto-scheduling.types.ts
export type SchedulePeriod = 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'custom';
export type ScheduleAlgorithm = 'simple' | 'balanced';

export interface AutoScheduleRequest {
  period: SchedulePeriod;
  start_date?: string;
  end_date?: string;
  algorithm?: ScheduleAlgorithm;
  auto_create_shifts?: boolean;
  notes?: string;
}

export interface AutoScheduleResponse {
  success: boolean;
  request_id: string;
  generated_at: string;
  period: string;
  date_range: {
    start: string;
    end: string;
    days_count: number;
  };
  shifts: AutoShiftDto[];
  stats: ScheduleStatsDto;
  staff_workload: StaffWorkloadDto[];
  warnings: string[];
  suggestions: string[];
  created_shifts?: any[];
  algorithm_used: string;
  generation_time_ms: number;
  message: string;
}

export interface AutoShiftDto {
  shift_id: string;
  title: string;
  role_id: string;
  role_name: string;
  user_id?: string;
  user_name?: string;
  start_time: string;
  end_time: string;
  location_id: string;
  location_name: string;
  duration_hours: number;
  break_minutes: number;
  day_of_week: string;
  notes?: string;
  assignment_reason?: string;
  is_filled: boolean;
  assignment_score?: number;
}

export interface ScheduleStatsDto {
  total_shifts: number;
  filled_shifts: number;
  unfilled_shifts: number;
  coverage_percentage: number;
  total_staff_hours: number;
  overtime_hours: number;
  average_hours_per_staff: number;
  min_hours_per_staff: number;
  max_hours_per_staff: number;
  fairness_score: number;
}

export interface StaffWorkloadDto {
  user_id: string;
  user_name: string;
  total_hours: number;
  scheduled_shifts: number;
  remaining_capacity: number;
  utilization_percentage: number;
  assigned_roles: string[];
}

export interface AutoScheduleHistory {
  _id: string;
  request_id: string;
  company_id: string;
  generated_by: string;
  period_type: string;
  start_date?: string;
  end_date?: string;
  algorithm_used: string;
  generation_time_ms: number;
  status: 'generated' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  period: SchedulePeriod;
  algorithm: ScheduleAlgorithm;
  auto_create: boolean;
  created_at: string;
}

export interface StaffAvailability {
  user_id: string;
  name: string;
  qualifications: string[];
  shift_preferences: any;
  weekly_working_hours: number;
}