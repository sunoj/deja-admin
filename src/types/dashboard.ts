import { Employee, Checkin, WorkOrder, SopRecord, LeaveRequest } from './api';

export type ViewType = 'calendar' | 'list';
export type BusinessType = 'checkins' | 'workOrders' | 'sopRecords' | 'leaveRequests';

export interface DashboardProps {
  checkins: Checkin[];
  workOrders: WorkOrder[];
  sopRecords: SopRecord[];
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  selectedEmployee: string;
  currentDate: Date;
  view: ViewType;
  selectedBusinessType: BusinessType;
  isLoading: boolean;
  error: string | null;
  onEmployeeChange: (employeeId: string) => void;
  onMonthChange: (date: Date) => void;
  onIpClick: (ip: string) => void;
  onLeaveRequestAction: (requestId: string, action: 'APPROVE' | 'REJECT') => Promise<void>;
  onLogout: () => Promise<void>;
}

export interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
} 