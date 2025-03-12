import { BusinessType } from './dashboard';
import { Employee, Checkin, WorkOrder, SopRecord, LeaveRequest, ScheduleRule } from './api';

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
  scheduleRules: ScheduleRule[];
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
  scheduledEmployees: string[];
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