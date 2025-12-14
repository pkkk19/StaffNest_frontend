export interface Role {
  _id: string;
  title: string;
  description?: string;
  pay_amount: number;
  pay_unit: 'hourly' | 'monthly' |'weekly' | 'fortnightly';
  shifts?: any[];
  default_break_minutes?: number;
  is_active: boolean;
  position?: number;
  company_id: string;
}

export interface CreateRoleDto {
  title: string;
  description?: string;
  pay_amount: number;
  pay_unit: 'hourly' | 'monthly' |'weekly' | 'fortnightly';
  shifts?: any[];
  default_break_minutes?: number;
  is_active?: boolean;
  position?: number;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}