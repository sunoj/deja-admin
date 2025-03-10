import React from 'react';
import { ListViewProps } from '../types/components';

const ListView: React.FC<ListViewProps> = ({
  checkins,
  workOrders,
  sopRecords,
  leaveRequests,
  selectedEmployee,
  selectedBusinessType,
  onIpClick,
  onLeaveRequestAction
}) => {
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadCSV = (data: any[], headers: string[], filename: string) => {
    const csvRows = [headers];
    csvRows.push(...data.map(row => row.map((cell: string | number | boolean) => cell.toString())));
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCheckinsCSV = () => {
    const headers = ['Employee Name', 'Check-in Time', 'Late Status', 'Penalty %', 'Exemption Applied', 'Meal Allowance', 'IP Address', 'Shop WiFi'];
    const data = checkins.map(checkin => [
      checkin.employees?.name || 'Unknown Employee',
      new Date(checkin.created_at).toLocaleString(),
      checkin.late_status,
      checkin.penalty_percentage,
      checkin.exemption_applied ? 'Yes' : 'No',
      checkin.meal_allowance,
      checkin.ip_address,
      checkin.is_shop_wifi ? 'Yes' : 'No'
    ]);
    downloadCSV(data, headers, `checkins_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadWorkOrdersCSV = () => {
    const headers = ['Title', 'Description', 'Created At', 'Status'];
    const data = workOrders.map(order => [
      order.title,
      order.description,
      new Date(order.created_at).toLocaleString(),
      order.status
    ]);
    downloadCSV(data, headers, `work_orders_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadSopRecordsCSV = () => {
    const headers = ['Workflow Name', 'Employee', 'Created At', 'Status'];
    const data = sopRecords.map(record => [
      record.workflow?.name || 'Unknown Workflow',
      record.employee?.name || 'Unknown Employee',
      new Date(record.created_at).toLocaleString(),
      record.status
    ]);
    downloadCSV(data, headers, `sop_records_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadLeaveRequestsCSV = () => {
    const headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Reason'];
    const data = leaveRequests.map(request => [
      request.employee_name,
      request.leave_type_name,
      request.start_date,
      request.end_date,
      request.status,
      request.reason
    ]);
    downloadCSV(data, headers, `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderCheckins = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadCheckinsCSV}
            className="btn btn-primary"
          >
            Download CSV
          </button>
        </div>
        {checkins.map((checkin) => (
          <div key={checkin.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{checkin.employees?.name || 'Unknown Employee'}</h3>
                <p className="text-sm text-gray-500">{formatTime(checkin.created_at)}</p>
              </div>
              <button
                onClick={() => onIpClick(checkin.ip_address)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                {checkin.ip_address}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWorkOrders = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadWorkOrdersCSV}
            className="btn btn-primary"
          >
            Download CSV
          </button>
        </div>
        {workOrders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{order.title}</h3>
                <p className="text-sm text-gray-500">{order.description}</p>
                <p className="text-sm text-gray-500">{formatTime(order.created_at)}</p>
              </div>
              <span className={`px-2 py-1 text-sm rounded-full ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSopRecords = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadSopRecordsCSV}
            className="btn btn-primary"
          >
            Download CSV
          </button>
        </div>
        {sopRecords.map((record) => (
          <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{record.workflow?.name || 'Unknown Workflow'}</h3>
                <p className="text-sm text-gray-500">{record.employee?.name || 'Unknown Employee'}</p>
                <p className="text-sm text-gray-500">{formatTime(record.created_at)}</p>
              </div>
              <span className={`px-2 py-1 text-sm rounded-full ${
                record.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {record.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLeaveRequests = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadLeaveRequestsCSV}
            className="btn btn-primary"
          >
            Download CSV
          </button>
        </div>
        {leaveRequests.map((request) => (
          <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{request.employee_name || 'Unknown Employee'}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(request.start_date)} - {formatDate(request.end_date)}
                </p>
                <p className="text-sm text-gray-500">{request.leave_type_name}</p>
                <p className="text-sm text-gray-500">{request.reason}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-sm rounded-full ${
                  request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
                {request.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => onLeaveRequestAction(request.id, 'APPROVE')}
                      className="text-sm text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onLeaveRequestAction(request.id, 'REJECT')}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedBusinessType === 'checkins' && renderCheckins()}
      {selectedBusinessType === 'workOrders' && renderWorkOrders()}
      {selectedBusinessType === 'sopRecords' && renderSopRecords()}
      {selectedBusinessType === 'leaveRequests' && renderLeaveRequests()}
    </div>
  );
};

export default ListView; 