import React from 'react';
import { DaySummaryModalProps } from '../types/components';

const DaySummaryModal: React.FC<DaySummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  checkins,
  workOrders,
  sopRecords,
  leaveRequests,
  onIpClick,
  onLeaveRequestAction
}) => {
  if (!isOpen) return null;

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Day Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">{formatDate(date)}</h3>
        </div>

        <div className="space-y-6">
          {/* Check-ins */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Check-ins</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {checkins.length === 0 ? (
                <p className="text-sm text-gray-500">No check-ins for this day</p>
              ) : (
                <ul className="space-y-2">
                  {checkins.map((checkin) => (
                    <li key={checkin.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-900">{checkin.employees.name}</span>
                        <span className={`text-sm ml-2 ${
                          checkin.late_status === 'perfect_on_time' ? 'text-green-600' :
                          checkin.late_status === 'on_time' ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          ({checkin.late_status.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatTime(checkin.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Work Orders */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Work Orders</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {workOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No work orders for this day</p>
              ) : (
                <ul className="space-y-2">
                  {workOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between">
                      <div>
                        <a 
                          href={`https://ts.nothingtodo.me/work-orders/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          {order.title}
                        </a>
                        <span className="text-sm text-gray-500 ml-2">
                          {order.creator.name} → {order.assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded ${
                          order.priority === 'high' ? 'bg-red-100 text-red-800' :
                          order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.priority}
                        </span>
                        <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* SOP Records */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">SOP Records</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {sopRecords.length === 0 ? (
                <p className="text-sm text-gray-500">No SOP records for this day</p>
              ) : (
                <ul className="space-y-2">
                  {sopRecords.map((record) => (
                    <li key={record.id} className="flex items-center justify-between">
                      <div>
                        <a 
                          href={`https://sop.nothingtodo.me/record/${record.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          {record.workflow.name}
                        </a>
                        <span className="text-sm text-gray-500 ml-2">
                          by {record.employee.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded ${
                          record.status === 'completed' ? 'bg-green-100 text-green-800' :
                          record.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                        <span className="text-sm text-gray-500">{formatTime(record.created_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Leave Requests */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Leave Requests</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {leaveRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No leave requests for this day</p>
              ) : (
                <ul className="space-y-2">
                  {leaveRequests.map((request) => (
                    <li key={request.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-900">{request.employee_name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({request.leave_type_name})
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded ${
                          request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => onLeaveRequestAction(request)}
                              className="text-sm text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onLeaveRequestAction(request)}
                              className="text-sm text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaySummaryModal; 