import React from 'react';
import { formatDate, formatTime, getStatusClass, getStatusText } from '../services/api';

function ListView({ checkins, workOrders, sopRecords, leaveRequests, selectedEmployee, selectedBusinessType, onIpClick, onLeaveRequestAction }) {
  let data = [];
  let columns = [];

  switch (selectedBusinessType) {
    case 'checkins':
      data = selectedEmployee === 'all'
        ? (Array.isArray(checkins) ? checkins : [])
        : (Array.isArray(checkins) ? checkins.filter(checkin => checkin.employee_id === selectedEmployee) : []);
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
        ? (Array.isArray(workOrders) ? workOrders : [])
        : (Array.isArray(workOrders) ? workOrders.filter(order => order.assigned_to === selectedEmployee) : []);
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
        ? (Array.isArray(sopRecords) ? sopRecords : [])
        : (Array.isArray(sopRecords) ? sopRecords.filter(record => record.employee_id === selectedEmployee) : []);
      columns = [
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'employee', label: 'Employee' },
        { key: 'workflow', label: 'SOP Name' },
        { key: 'status', label: 'Status' }
      ];
      break;
    case 'leaveRequests':
      data = selectedEmployee === 'all'
        ? (Array.isArray(leaveRequests) ? leaveRequests : [])
        : (Array.isArray(leaveRequests) ? leaveRequests.filter(request => request.employee_id === selectedEmployee) : []);
      columns = [
        { key: 'employee', label: 'Employee' },
        { key: 'leaveType', label: 'Leave Type' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'endDate', label: 'End Date' },
        { key: 'status', label: 'Status' },
        { key: 'updatedAt', label: 'Updated At' },
        { key: 'actions', label: 'Actions' }
      ];
      break;
    default:
      data = [];
      columns = [];
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

  const handleLeaveRequestAction = async (requestId, action) => {
    if (onLeaveRequestAction) {
      await onLeaveRequestAction(requestId, action);
    }
  };

  if (sortedData.length === 0) {
    return (
      <div className="card">
        <div className="flex justify-end p-2 sm:p-4">
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L3 7H6V3H10V7H13L8 12Z" fill="currentColor"/>
              <path d="M2 14H14V12H2V14Z" fill="currentColor"/>
            </svg>
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="table">
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-500 text-sm">
                    No {selectedBusinessType} records found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
        } else if (selectedBusinessType === 'leaveRequests') {
          return item.employee_name || 'Unknown';
        }
        return 'Unknown';
      case 'status':
        if (selectedBusinessType === 'checkins') {
          return (
            <span className={`badge ${getStatusClass(item.late_status)}`}>
              {getStatusText(item.late_status)}
            </span>
          );
        } else if (selectedBusinessType === 'leaveRequests') {
          return (
            <span className={`badge ${getLeaveRequestStatusClass(item.status)}`}>
              {item.status}
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
      case 'leaveType':
        return item.leave_type_name || '-';
      case 'startDate':
        return formatDate(new Date(item.start_date));
      case 'endDate':
        return formatDate(new Date(item.end_date));
      case 'updatedAt':
        return formatDate(new Date(item.updated_at));
      case 'actions':
        if (selectedBusinessType === 'leaveRequests' && item.status === 'PENDING') {
          return (
            <div className="flex space-x-2">
              <button
                onClick={() => handleLeaveRequestAction(item.id, 'APPROVE')}
                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
              <button
                onClick={() => handleLeaveRequestAction(item.id, 'REJECT')}
                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject
              </button>
            </div>
          );
        }
        return null;
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

  const getLeaveRequestStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-end p-2 sm:p-4">
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L3 7H6V3H10V7H13L8 12Z" fill="currentColor"/>
            <path d="M2 14H14V12H2V14Z" fill="currentColor"/>
          </svg>
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <table className="table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column.key} className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => (
                <tr key={item.id}>
                  {columns.map(column => (
                    <td key={column.key} className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm">
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ListView; 