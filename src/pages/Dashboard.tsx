import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import CalendarView from '../components/CalendarView';
import ListView from '../components/ListView';
import EmployeeFilter from '../components/EmployeeFilter';
import IpInfoModal from '../components/IpInfoModal';
import { dataApi } from '../services/api';
import { ViewType, BusinessType, IpInfo } from '../types/dashboard';
import { Employee, Checkin, WorkOrder, SopRecord, LeaveRequest, ScheduleRule } from '../types/api';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [view, setView] = useState<ViewType>('calendar');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [sopRecords, setSopRecords] = useState<SopRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
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

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [
        employeesData,
        checkinsData,
        workOrdersData,
        sopRecordsData,
        leaveRequestsData,
        scheduleRulesData
      ] = await Promise.all([
        dataApi.getEmployees(),
        dataApi.fetchCheckins(startDate, endDate, selectedEmployee),
        dataApi.fetchWorkOrders(startDate, endDate, selectedEmployee),
        dataApi.fetchSopRecords(startDate, endDate, selectedEmployee),
        dataApi.fetchLeaveRequests(startDate, endDate, selectedEmployee),
        dataApi.fetchScheduleRules(selectedEmployee)
      ]);

      setEmployees(employeesData);
      setCheckins(checkinsData);
      setWorkOrders(workOrdersData);
      setSopRecords(sopRecordsData);
      setLeaveRequests(leaveRequestsData);
      setScheduleRules(scheduleRulesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleIpClick = (ip: string) => {
    setIpInfo({ ip });
    setShowIpModal(true);
  };

  const handleLeaveRequestAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await dataApi.updateLeaveRequest(requestId, action);
      // Reload data after action
      await loadData();
    } catch (err) {
      console.error('Error updating leave request:', err);
      alert('Failed to update leave request. Please try again.');
    }
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
            <Link
              to="/employees"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              Employees
            </Link>
            <Link
              to="/schedules"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              Schedules
            </Link>
            <Link
              to="/proposals"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              Proposals
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium shadow-sm"
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
                scheduleRules={scheduleRules}
                currentDate={currentDate}
                selectedEmployee={selectedEmployee}
                onMonthChange={handleMonthChange}
              />
            )}
            {view === 'list' && (
              <>
                <div className="flex space-x-1 bg-gray-100 p-1 m-4 rounded-lg">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedBusinessType === 'checkins'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedBusinessType('checkins')}
                  >
                    Check-ins
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedBusinessType === 'workOrders'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedBusinessType('workOrders')}
                  >
                    Work Orders
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedBusinessType === 'sopRecords'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedBusinessType('sopRecords')}
                  >
                    SOP Records
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedBusinessType === 'leaveRequests'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSelectedBusinessType('leaveRequests')}
                  >
                    Leave Requests
                  </button>
                </div>
                <ListView
                  checkins={checkins}
                  workOrders={workOrders}
                  sopRecords={sopRecords}
                  leaveRequests={leaveRequests}
                  selectedEmployee={selectedEmployee}
                  selectedBusinessType={selectedBusinessType}
                  onIpClick={handleIpClick}
                  onLeaveRequestAction={handleLeaveRequestAction}
                />
              </>
            )}
          </div>
        )}

        {showIpModal && ipInfo && (
          <IpInfoModal
            isOpen={showIpModal}
            onClose={() => setShowIpModal(false)}
            ipInfo={ipInfo}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard; 