export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface Checkin {
  id: string;
  employeeId: string;
  timestamp: string;
  ip: string;
  location?: string;
  device?: string;
  status: 'perfect_on_time' | 'on_time' | 'late_10' | 'late_15';
}

export interface WorkOrder {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SopRecord {
  id: string;
  employeeId: string;
  sopId: string;
  completedAt: string;
  status: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason?: string;
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

export type ViewType = 'calendar' | 'list';
export type BusinessType = 'checkins' | 'workOrders' | 'sopRecords'; 