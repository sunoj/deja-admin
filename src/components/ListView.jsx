import React from 'react';
import { formatDate, formatTime, getStatusClass, getStatusText } from '../services/api';

function ListView({ checkins, workOrders, sopRecords, selectedEmployee, selectedBusinessType, onIpClick }) {
  let data = [];
  let columns = [];

  switch (selectedBusinessType) {
    case 'checkins':
      data = selectedEmployee === 'all'
        ? [...checkins]
        : checkins.filter(checkin => checkin.employee_id === selectedEmployee);
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'employee', label: 'Employee' },
        { key: 'status', label: 'Status' },
        { key: 'penalty', label: 'Penalty' },
        { key: 'exemption', label: 'Exemption' },
        { key: 'mealAllowance', label: 'Meal Allowance' },
        { key: 'ipAddress', label: 'IP Address' }
      ];
      break;
    case 'workOrders':
      data = selectedEmployee === 'all'
        ? [...workOrders]
        : workOrders.filter(order => order.assigned_to === selectedEmployee);
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'employee', label: 'Assignee' },
        { key: 'title', label: 'Title' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' }
      ];
      break;
    case 'sopRecords':
      data = selectedEmployee === 'all'
        ? [...sopRecords]
        : sopRecords.filter(record => record.employee_id === selectedEmployee);
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'employee', label: 'Employee' },
        { key: 'workflow', label: 'SOP Name' },
        { key: 'status', label: 'Status' }
      ];
      break;
  }

  const sortedData = data.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const handleDownload = () => {
    if (sortedData.length === 0) {
      alert(`No ${selectedBusinessType} data to download`);
      return;
    }

    const headers = columns.map(col => col.label);
    const csvData = sortedData.map(item => {
      return columns.map(col => {
        const value = renderCell(item, col);
        // Handle React elements (like badges) by extracting text content
        if (typeof value === 'object' && value.props) {
          return value.props.children;
        }
        return value;
      });
    });

    const csvContent = [headers].concat(csvData)
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedBusinessType}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sortedData.length === 0) {
    return (
      <div className="card">
        <div className="flex justify-end p-4">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L3 7H6V3H10V7H13L8 12Z" fill="currentColor"/>
              <path d="M2 14H14V12H2V14Z" fill="currentColor"/>
            </svg>
            Download CSV
          </button>
        </div>
        <div className="table-container">
          <table className="table">
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  No {selectedBusinessType} records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const renderCell = (item, column) => {
    switch (column.key) {
      case 'date':
        return formatDate(new Date(item.created_at));
      case 'time':
        return formatTime(new Date(item.created_at));
      case 'employee':
        if (selectedBusinessType === 'checkins') {
          return item.employees ? item.employees.name : 'Unknown';
        } else if (selectedBusinessType === 'workOrders') {
          return item.assignee ? item.assignee.name : 'Unknown';
        } else if (selectedBusinessType === 'sopRecords') {
          return item.employee ? item.employee.name : 'Unknown';
        }
        return 'Unknown';
      case 'status':
        if (selectedBusinessType === 'checkins') {
          return (
            <span className={`badge ${getStatusClass(item.late_status)}`}>
              {getStatusText(item.late_status)}
            </span>
          );
        }
        return (
          <span className={`badge ${getStatusClass(item.status)}`}>
            {item.status}
          </span>
        );
      case 'priority':
        return (
          <span className={`badge ${getPriorityClass(item.priority)}`}>
            {item.priority}
          </span>
        );
      case 'workflow':
        return (
          <a 
            href={`https://sop.nothingtodo.me/record/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            {item.workflow ? item.workflow.name : '-'}
          </a>
        );
      case 'penalty':
        return item.penalty_percentage ? `${item.penalty_percentage}%` : '-';
      case 'exemption':
        return item.exemption_applied ? 'Yes' : 'No';
      case 'mealAllowance':
        return item.meal_allowance ? 'Yes' : 'No';
      case 'ipAddress':
        return (
          <span
            className="text-blue-600 cursor-pointer hover:text-blue-800"
            onClick={() => onIpClick(item.ip_info)}
          >
            {item.ip_address || '-'}
          </span>
        );
      case 'title':
        return (
          <a 
            href={`https://ts.nothingtodo.me/work-orders/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            {item.title || '-'}
          </a>
        );
      case 'description':
        return item.description || '-';
      default:
        return '-';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-end p-4">
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L3 7H6V3H10V7H13L8 12Z" fill="currentColor"/>
            <path d="M2 14H14V12H2V14Z" fill="currentColor"/>
          </svg>
          Download CSV
        </button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map(item => (
              <tr key={item.id}>
                {columns.map(column => (
                  <td key={column.key}>{renderCell(item, column)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListView; 