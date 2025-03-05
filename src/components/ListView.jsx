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
      <div className="list-view">
        <div className="table-container">
          <table>
            <tbody>
              <tr>
                <td colSpan="8" className="no-data">No check-in records found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="list-view">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Penalty</th>
              <th>Exemption</th>
              <th>Meal Allowance</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {sortedCheckins.map(checkin => {
              const checkinDate = new Date(checkin.created_at);
              const employeeName = checkin.employees ? checkin.employees.name : 'Unknown';
              const statusClass = getStatusClass(checkin.late_status);
              const penalty = checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '-';
              const exemption = checkin.exemption_applied ? 'Yes' : 'No';
              const mealAllowance = checkin.meal_allowance ? 'Yes' : 'No';

              return (
                <tr key={checkin.id}>
                  <td data-label="Date">{formatDate(checkinDate)}</td>
                  <td data-label="Time">{formatTime(checkinDate)}</td>
                  <td data-label="Employee">{employeeName}</td>
                  <td data-label="Status" className={statusClass}>
                    {getStatusText(checkin.late_status)}
                  </td>
                  <td data-label="Penalty">{penalty}</td>
                  <td data-label="Exemption">{exemption}</td>
                  <td data-label="Meal Allowance">{mealAllowance}</td>
                  <td
                    data-label="IP Address"
                    className="ip-address-cell"
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