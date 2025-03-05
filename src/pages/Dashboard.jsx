import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CalendarView from '../components/CalendarView';
import ListView from '../components/ListView';
import EmployeeFilter from '../components/EmployeeFilter';
import DownloadButton from '../components/DownloadButton';
import IpInfoModal from '../components/IpInfoModal';
import { dataApi } from '../services/api';

function Dashboard() {
  const { logout } = useAuth();
  const [view, setView] = useState('calendar');
  const [checkins, setCheckins] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [sopRecords, setSopRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [showIpModal, setShowIpModal] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState('checkins');

  useEffect(() => {
    loadData();
  }, [currentDate, selectedEmployee]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const [checkinsData, workOrdersData, sopRecordsData] = await Promise.all([
        dataApi.fetchCheckins(),
        dataApi.fetchWorkOrders(startDate, endDate, selectedEmployee),
        dataApi.fetchSopRecords(startDate, endDate, selectedEmployee)
      ]);
      
      setCheckins(checkinsData);
      setWorkOrders(workOrdersData);
      setSopRecords(sopRecordsData);
      
      const uniqueEmployees = Array.from(
        new Map(checkinsData.map(checkin => [checkin.employee_id, checkin.employees]))
      ).map(([id, employee]) => ({ id, name: employee.name }));
      
      setEmployees(uniqueEmployees);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
  };

  const handleMonthChange = (date) => {
    setCurrentDate(date);
  };

  const handleIpClick = (ipInfo) => {
    setIpInfo(ipInfo);
    setShowIpModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">DEJA Admin Dashboard</h1>
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

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <EmployeeFilter
                employees={employees}
                selectedEmployee={selectedEmployee}
                onChange={handleEmployeeChange}
              />
              {view === 'list' && (
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 14H2V2H6V3H3V13H5V3H6V14Z" fill="currentColor"/>
                  <path d="M11 8L7 4V7H4V9H7V12L11 8Z" fill="currentColor"/>
                </svg>
                Logout
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
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
      </div>

      <IpInfoModal
        ipInfo={ipInfo}
        isOpen={showIpModal}
        onClose={() => setShowIpModal(false)}
      />
    </div>
  );
}

export default Dashboard; 