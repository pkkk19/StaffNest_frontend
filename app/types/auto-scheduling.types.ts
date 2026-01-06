// src/app/types/auto-scheduling.types.ts
export interface AutoScheduleRequest {
  period: 'day' | 'week' | 'month' | 'custom';
  start_date?: string;
  end_date?: string;
  fill_open_only: boolean;
  consider_preferences: boolean;
  ensure_legal_compliance: boolean;
  optimize_existing: boolean;
  auto_create_shifts: boolean;
  algorithm?: string;
  balance_workload?: boolean;
  max_shifts_per_staff?: number;
  excluded_staff_ids?: string[];
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
  schedule: {
    shifts: AutoShift[];
    warnings: string[];
    suggestions: string[];
    summary: {
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
    };
  };
  staff_workload: StaffWorkload[];
  created_shifts?: any[];
  algorithm_used: string;
  generation_time_ms: number;
  message: string;
}

export interface AutoShift {
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

export interface StaffWorkload {
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
  generated_by: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  period_type: 'day' | 'week' | 'month' | 'custom';
  start_date?: string;
  end_date?: string;
  algorithm_used: string;
  generated_shifts: any[];
  warnings: string[];
  status: 'generated' | 'applied' | 'failed' | 'cancelled';
  shifts_created: number;
  shifts_failed: number;
  generation_time_ms: number;
  created_at: string;
}

export interface ScheduleTemplate {
  _id: string;
  name: string;
  description?: string;
  schedule: any;
  settings: {
    period: 'day' | 'week' | 'month' | 'custom';
    algorithm: string;
    fill_open_only: boolean;
    consider_preferences: boolean;
    ensure_legal_compliance: boolean;
    optimize_existing: boolean;
    balance_workload: boolean;
  };
  used_count: number;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

export interface ScheduleViewMode {
  id: 'calendar' | 'timeline' | 'gantt' | 'list';
  name: string;
  description: string;
  icon: string;
}

export interface StaffAvailability {
  user_id: string;
  name: string;
  qualifications: string[];
  max_hours_per_week: number;
  assigned_hours: number;
  unavailable_dates: string[];
  available_for: string[];
}