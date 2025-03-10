import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CalendarView from '../components/CalendarView';
import ListView from '../components/ListView';
import EmployeeFilter from '../components/EmployeeFilter';
import DownloadButton from '../components/DownloadButton';
import IpInfoModal from '../components/IpInfoModal';
import { dataApi } from '../services/api';
import {
  Employee,
  Checkin,
  WorkOrder,
  SopRecord,
  LeaveRequest,
  IpInfo,
  ViewType,
  BusinessType
} from '../types/dashboard';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { logout } = useAuth();
  const [view, setView] = useState<ViewType>('calendar');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [sopRecords, setSopRecords] = useState<SopRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);
  const [showIpModal, setShowIpModal] = useState<boolean>(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType>('checkins');

  useEffect(() => {
    loadData();
  }, [currentDate, selectedEmployee]);

  const loadData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Fetch leave requests
      const leaveResponse = await fetch('/api/leave/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          employeeId: selectedEmployee
        }),
      });

      if (!leaveResponse.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const leaveData = await leaveResponse.json();
      setLeaveRequests(leaveData);

      // Fetch other data
      const [checkinsData, workOrdersData, sopRecordsData, employeesData] = await Promise.all([
        dataApi.fetchCheckins(startDate, endDate, selectedEmployee),
        dataApi.fetchWorkOrders(startDate, endDate),
        dataApi.fetchSopRecords(startDate, endDate),
        dataApi.getEmployees()
      ]);

      setCheckins(checkinsData);
      setWorkOrders(workOrdersData);
      setSopRecords(sopRecordsData);
      setEmployees(employeesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading data';
      setError(errorMessage);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeChange = (employeeId: string): void => {
    setSelectedEmployee(employeeId);
  };

  const handleMonthChange = (date: Date): void => {
    setCurrentDate(date);
  };

  const handleIpClick = (ip: IpInfo): void => {
    setIpInfo(ip);
    setShowIpModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <EmployeeFilter
              employees={employees}
              selectedEmployee={selectedEmployee}
              onChange={handleEmployeeChange}
            />
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  view === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setView('calendar')}
              >
                Calendar View
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setView('list')}
              >
                List View
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DownloadButton
              checkins={checkins}
              workOrders={workOrders}
              sopRecords={sopRecords}
              leaveRequests={leaveRequests}
              selectedEmployee={selectedEmployee}
              currentDate={currentDate}
            />
            <button
              onClick={logout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative shadow-sm" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            {view === 'calendar' && (
              <CalendarView
                checkins={checkins}
                workOrders={workOrders}
                sopRecords={sopRecords}
                leaveRequests={leaveRequests}
                currentDate={currentDate}
                selectedEmployee={selectedEmployee}
                onMonthChange={handleMonthChange}
              />
            )}
            {view === 'list' && (
              <ListView
                checkins={checkins}
                workOrders={workOrders}
                sopRecords={sopRecords}
                selectedEmployee={selectedEmployee}
                selectedBusinessType={selectedBusinessType}
                onIpClick={handleIpClick}
              />
            )}
          </div>
        )}
      </div>

      <IpInfoModal
        ipInfo={ipInfo}
        isOpen={showIpModal}
        onClose={() => setShowIpModal(false)}
      />
    </div>
  );
};

export default Dashboard; 