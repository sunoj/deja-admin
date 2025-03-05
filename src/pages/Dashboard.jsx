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
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [showIpModal, setShowIpModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataApi.fetchCheckins();
      setCheckins(data);
      
      const uniqueEmployees = Array.from(
        new Map(data.map(checkin => [checkin.employee_id, checkin.employees]))
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

  const handleDownload = () => {
    const filteredCheckins = selectedEmployee === 'all'
      ? checkins
      : checkins.filter(checkin => checkin.employee_id === selectedEmployee);

    if (filteredCheckins.length === 0) {
      alert('No check-in data to download');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'Employee',
      'Status',
      'Penalty',
      'Exemption',
      'Meal Allowance',
      'IP Address'
    ];

    const csvData = filteredCheckins.map(checkin => {
      const checkinDate = new Date(checkin.created_at);
      const employeeName = checkin.employees ? checkin.employees.name : 'Unknown';
      const status = getStatusText(checkin.late_status);
      const penalty = checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '-';
      const exemption = checkin.exemption_applied ? 'Yes' : 'No';
      const mealAllowance = checkin.meal_allowance ? 'Yes' : 'No';

      return [
        formatDate(checkinDate),
        formatTime(checkinDate),
        employeeName,
        status,
        penalty,
        exemption,
        mealAllowance,
        checkin.ip_address || '-'
      ];
    });

    const csvContent = [headers].concat(csvData)
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `checkins_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  view === 'calendar'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setView('calendar')}
              >
                Calendar View
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  view === 'list'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => setView('list')}
              >
                List View
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <EmployeeFilter
              employees={employees}
              selectedEmployee={selectedEmployee}
              onChange={handleEmployeeChange}
            />
            <div className="flex space-x-2">
              <DownloadButton onClick={handleDownload} />
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-sm"
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
                  currentDate={currentDate}
                  selectedEmployee={selectedEmployee}
                  onMonthChange={handleMonthChange}
                />
              )}
              {view === 'list' && (
                <ListView
                  checkins={checkins}
                  selectedEmployee={selectedEmployee}
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