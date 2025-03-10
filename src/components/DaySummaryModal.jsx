import React from 'react';
import { formatTime, getStatusClass, getStatusText } from '../services/api';

function DaySummaryModal({ isOpen, onClose, date, data }) {
  if (!isOpen) return null;

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const { checkins, workOrders, sopRecords, leaveRequests } = data;

  const getLeaveRequestClass = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content mx-4 sm:mx-auto max-w-lg">
        <div className="flex justify-between items-center mb-4 sm:mb-5">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{formattedDate}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-150"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Leave Requests Section */}
          {leaveRequests.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Leave Requests</h4>
              <div className="space-y-2 sm:space-y-3">
                {leaveRequests.map(request => (
                  <div
                    key={request.id}
                    className={`p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md ${getLeaveRequestClass(request.status)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium text-sm sm:text-base text-gray-900">{request.employee_name}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{request.leave_type_name}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-medium text-sm sm:text-base text-gray-900">{request.status}</div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-ins Section */}
          {checkins.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Check-ins</h4>
              <div className="space-y-2 sm:space-y-3">
                {checkins.map(checkin => {
                  const checkinTime = formatTime(checkin.created_at);
                  const employeeName = checkin.employees ? checkin.employees.name : 'Unknown';
                  const status = getStatusText(checkin.late_status);
                  const penalty = checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '0%';
                  const exemption = checkin.exemption_applied ? 'Yes' : 'No';

                  return (
                    <div
                      key={checkin.id}
                      className={`p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md ${getStatusClass(checkin.late_status)}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div>
                          <div className="font-medium text-sm sm:text-base text-gray-900">{employeeName}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{checkinTime}</div>
                        </div>
                        <div className="sm:text-right">
                          <div className="font-medium text-sm sm:text-base text-gray-900">{status}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Penalty: {penalty}</div>
                        </div>
                      </div>
                      {exemption === 'Yes' && (
                        <div className="mt-2 sm:mt-3 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm text-blue-600 font-medium">Exemption Applied</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Work Orders Section */}
          {workOrders.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Work Orders</h4>
              <div className="space-y-2 sm:space-y-3">
                {workOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md bg-blue-50 border border-blue-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium text-sm sm:text-base text-gray-900">{order.title}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{order.description}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-medium text-sm sm:text-base text-gray-900">{order.status}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Priority: {order.priority}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOP Records Section */}
          {sopRecords.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">SOP Records</h4>
              <div className="space-y-2 sm:space-y-3">
                {sopRecords.map(record => (
                  <div
                    key={record.id}
                    className="p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md bg-purple-50 border border-purple-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div>
                        <div className="font-medium text-sm sm:text-base text-gray-900">
                          <a 
                            href={`https://sop.nothingtodo.me/record/${record.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800"
                          >
                            {record.workflow ? record.workflow.name : 'Unknown Workflow'}
                          </a>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">{record.employee ? record.employee.name : 'Unknown Employee'}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-medium text-sm sm:text-base text-gray-900">{record.status}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{formatTime(record.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DaySummaryModal; 