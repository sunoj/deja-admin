import { Employee, Checkin, WorkOrder, SopRecord, LeaveRequest } from './api';
import { BusinessType } from './dashboard';

export interface EmployeeFilterProps {
  employees: Employee[];
  selectedEmployee: string;
  onChange: (employeeId: string) => void;
}

export interface CalendarViewProps {
  checkins: Checkin[];
  workOrders: WorkOrder[];
  sopRecords: SopRecord[];
  leaveRequests: LeaveRequest[];
  currentDate: Date;
  selectedEmployee: string;
  onMonthChange: (date: Date) => void;
}

export interface ListViewProps {
  checkins: Checkin[];
  workOrders: WorkOrder[];
  sopRecords: SopRecord[];
  leaveRequests: LeaveRequest[];
  selectedEmployee: string;
  selectedBusinessType: BusinessType;
  onIpClick: (ip: string) => void;
  onLeaveRequestAction: (requestId: string, action: 'APPROVE' | 'REJECT') => void;
}

export interface DaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  checkins: Checkin[];
  workOrders: WorkOrder[];
  sopRecords: SopRecord[];
  leaveRequests: LeaveRequest[];
  onIpClick: (ip: string) => void;
  onLeaveRequestAction: (request: LeaveRequest) => void;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'lg';
}

export interface IpInfoModalProps {
  ipInfo: { ip: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface Employee {
  id: string;
  name: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  employee_id: string;
  created_at: string;
  late_status: string;
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
  created_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  images: string[];
  priority: string;
  creator: {
    name: string;
  };
  assignee: {
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
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
} 