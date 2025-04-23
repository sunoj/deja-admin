export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  token?: string;
  admin_id?: string;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (username: string, password: string, confirmPassword: string, email: string) => Promise<AuthResponse>;
}

export type ApiHeaders = Record<string, string>;

export interface Employee {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  is_deleted: boolean;
  employment_status: string;
  created_at: string;
  updated_at: string;
  recent_checkins?: Checkin[];
}

export interface Checkin {
  id: string;
  employee_id: string;
  created_at: string;
  late_status: LateStatus;
  penalty_percentage: number;
  exemption_applied: boolean;
  meal_allowance: number;
  user_agent: string;
  ip_address: string;
  ip_info: any;
  is_shop_wifi: boolean | null;
  employees: {
    id: string;
    name: string;
  };
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  images: string[];
  creator: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string;
  };
}

export interface SopRecord {
  id: string;
  workflow_id: string;
  employee_id: string;
  status: string;
  created_at: string;
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  employee: {
    name: string;
  };
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type_id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  medical_certificate_url?: string;
  created_at: string;
  updated_at: string;
}

export type LateStatus = 'perfect_on_time' | 'on_time' | 'late_10' | 'late_15';

export interface ScheduleRule {
  id: string;
  employee_id: string;
  name: string;
  is_default: boolean;
  work_days: number[]; // 0-6 for Sunday-Saturday
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
} 