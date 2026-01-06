// types/roles.ts
export interface TaskItem {
  task: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: Date;
}

export interface ShiftTime {
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  shift_type: 'same_day' | 'next_day' | 'cross_day';
}

export interface DailyShift {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  shifts: ShiftTime[];
  is_active: boolean;
}

export interface RoleShift {
  _id?: string;
  name: string;
  start_day: string;
  end_day: string;
  start_time: string;
  end_time: string;
  location_id: string;
  required_staff: number;
  tasks: TaskItem[];
  is_active: boolean;
}

export interface Role {
  _id: string;
  title: string;
  description?: string;
  daily_schedule: DailyShift[];
  shifts: RoleShift[];
  qualified_users: string[];
  default_break_minutes?: number;
  is_active: boolean;
  position?: number;
  company_id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  title: string;
  description?: string;
  daily_schedule?: DailyShift[];
  shifts?: RoleShift[];
  qualified_users?: string[];
  default_break_minutes?: number;
  is_active?: boolean;
  position?: number;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}