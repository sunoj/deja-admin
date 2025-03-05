import React from 'react';
import { formatDate, formatTime, getStatusClass, getStatusText } from '../services/api';

function ListView({ checkins, selectedEmployee, onIpClick }) {
  const filteredCheckins = selectedEmployee === 'all'
    ? [...checkins]
    : checkins.filter(checkin => checkin.employee_id === selectedEmployee);

  const sortedCheckins = filteredCheckins.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  if (sortedCheckins.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody>
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No check-in records found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exemption</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal Allowance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCheckins.map(checkin => {
              const checkinDate = new Date(checkin.created_at);
              const employeeName = checkin.employees ? checkin.employees.name : 'Unknown';
              const statusClass = getStatusClass(checkin.late_status);
              const penalty = checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '-';
              const exemption = checkin.exemption_applied ? 'Yes' : 'No';
              const mealAllowance = checkin.meal_allowance ? 'Yes' : 'No';

              return (
                <tr key={checkin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(checkinDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(checkinDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employeeName}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${statusClass}`}>
                    {getStatusText(checkin.late_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{penalty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exemption}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mealAllowance}</td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                    onClick={() => onIpClick(checkin.ip_info)}
                  >
                    {checkin.ip_address || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListView; 