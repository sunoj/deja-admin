import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListViewProps } from '../types/components';

const ITEMS_PER_PAGE = 10;

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
  const [pageStates, setPageStates] = useState({
    checkins: 1,
    workOrders: 1,
    sopRecords: 1,
    leaveRequests: 1
  });

  const getCurrentPage = (type: string) => pageStates[type as keyof typeof pageStates];
  const setCurrentPage = (type: string, page: number) => {
    setPageStates(prev => ({
      ...prev,
      [type]: page
    }));
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const bangkokTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (7 * 60 * 60000));
    return bangkokTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const bangkokTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (7 * 60 * 60000));
    return bangkokTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentItems = (items: any[], type: string) => {
    const currentPage = getCurrentPage(type);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (items: any[]) => {
    return Math.ceil(items.length / ITEMS_PER_PAGE);
  };

  const renderPagination = (totalPages: number, type: string) => {
    if (totalPages <= 1) return null;
    const currentPage = getCurrentPage(type);

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(type, Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(type, Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalPages * ITEMS_PER_PAGE)}
              </span>{' '}
              of <span className="font-medium">{totalPages * ITEMS_PER_PAGE}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(type, Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(type, index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === index + 1
                      ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(type, Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
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
    const headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Half Day', 'Half Day Type', 'Status', 'Reason'];
    const data = leaveRequests.map(request => [
      request.employee_name,
      request.leave_type_name,
      request.start_date,
      request.end_date,
      request.is_half_day ? 'Yes' : 'No',
      request.is_half_day ? request.half_day_type : '',
      request.status,
      request.reason
    ]);
    downloadCSV(data, headers, `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderCheckins = () => {
    const currentCheckins = getCurrentItems(checkins, 'checkins');
    const totalPages = getTotalPages(checkins);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Check-in Records</h2>
            <p className="mt-1 text-sm text-gray-500">View and manage employee check-in history</p>
          </div>
          <button
            onClick={downloadCheckinsCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {currentCheckins.map((checkin) => (
              <div key={checkin.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{checkin.employees?.name || 'Unknown Employee'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(checkin.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onIpClick(checkin.ip_address)}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {checkin.ip_address}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderPagination(totalPages, 'checkins')}
      </div>
    );
  };

  const renderWorkOrders = () => {
    const currentOrders = getCurrentItems(workOrders, 'workOrders');
    const totalPages = getTotalPages(workOrders);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Work Orders</h2>
            <p className="mt-1 text-sm text-gray-500">Track and manage work orders</p>
          </div>
          <button
            onClick={downloadWorkOrdersCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {currentOrders.map((order) => (
              <Link
                key={order.id}
                to={`https://ts.nothingtodo.me/work-orders/${order.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{order.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                      order.status === 'completed' ? 'bg-green-50 text-green-700' :
                      order.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {renderPagination(totalPages, 'workOrders')}
      </div>
    );
  };

  const renderSopRecords = () => {
    const currentRecords = getCurrentItems(sopRecords, 'sopRecords');
    const totalPages = getTotalPages(sopRecords);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">SOP Records</h2>
            <p className="mt-1 text-sm text-gray-500">Standard Operating Procedures records</p>
          </div>
          <button
            onClick={downloadSopRecordsCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {currentRecords.map((record) => (
              <Link
                key={record.id}
                to={`https://sop.nothingtodo.me/record/${record.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{record.workflow?.name || 'Unknown Workflow'}</h3>
                      <p className="text-sm text-gray-600">{record.employee?.name || 'Unknown Employee'}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(record.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                      record.status === 'completed' ? 'bg-green-50 text-green-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {renderPagination(totalPages, 'sopRecords')}
      </div>
    );
  };

  const renderLeaveRequests = () => {
    const currentRequests = getCurrentItems(leaveRequests, 'leaveRequests');
    const totalPages = getTotalPages(leaveRequests);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Leave Requests</h2>
            <p className="mt-1 text-sm text-gray-500">Manage employee leave requests</p>
          </div>
          <button
            onClick={downloadLeaveRequestsCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="divide-y divide-gray-200">
            {currentRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.employee_name || 'Unknown Employee'}</h3>
                      <p className="text-sm text-gray-600">
                        {request.leave_type_name}
                        {request.is_half_day && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Half Day ({request.half_day_type})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{request.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                      request.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                      request.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                    {request.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onLeaveRequestAction(request.id, 'APPROVE')}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-900 font-medium bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => onLeaveRequestAction(request.id, 'REJECT')}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-900 font-medium bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderPagination(totalPages, 'leaveRequests')}
      </div>
    );
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      {selectedBusinessType === 'checkins' && renderCheckins()}
      {selectedBusinessType === 'workOrders' && renderWorkOrders()}
      {selectedBusinessType === 'sopRecords' && renderSopRecords()}
      {selectedBusinessType === 'leaveRequests' && renderLeaveRequests()}
    </div>
  );
};

export default ListView; 