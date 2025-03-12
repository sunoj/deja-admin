import React, { useState, useEffect } from 'react';
import { CalendarViewProps } from '../types/components';
import DaySummaryModal from './DaySummaryModal';

const CalendarView: React.FC<CalendarViewProps> = ({
  checkins,
  workOrders,
  sopRecords,
  leaveRequests,
  scheduleRules,
  currentDate,
  selectedEmployee,
  onMonthChange
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Debug logging for incoming data
  useEffect(() => {
    console.log('CalendarView received data:', {
      checkins: checkins?.length || 0,
      workOrders: workOrders?.length || 0,
      sopRecords: sopRecords?.length || 0,
      leaveRequests: leaveRequests?.length || 0,
      scheduleRules: scheduleRules?.length || 0,
      currentDate,
      selectedEmployee
    });
  }, [checkins, workOrders, sopRecords, leaveRequests, scheduleRules, currentDate, selectedEmployee]);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const isWorkDay = (date: Date, rules: typeof scheduleRules): boolean => {
    // Find the applicable rule for this date
    const applicableRule = rules.find(rule => {
      const startDate = new Date(rule.start_date);
      const endDate = rule.end_date ? new Date(rule.end_date) : null;
      
      return date >= startDate && (!endDate || date <= endDate) &&
             (rule.employee_id === selectedEmployee || rule.is_default);
    });

    if (!applicableRule) return true; // Default to workday if no rule found

    // Check if the day of week is in work_days
    const dayOfWeek = date.getDay();
    return applicableRule.work_days.includes(dayOfWeek);
  };

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const filteredCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.created_at);
      return checkinDate >= dayStart && checkinDate <= dayEnd;
    });

    const filteredWorkOrders = workOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dayStart && orderDate <= dayEnd;
    });

    const filteredSopRecords = sopRecords.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate >= dayStart && recordDate <= dayEnd;
    });

    const filteredLeaveRequests = leaveRequests.filter(request => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      return startDate <= dayEnd && endDate >= dayStart;
    });

    // Get scheduled employees for this day
    const scheduledEmployeeIds = scheduleRules
      .filter(rule => {
        const startDate = new Date(rule.start_date);
        const endDate = rule.end_date ? new Date(rule.end_date) : null;
        const isInDateRange = date >= startDate && (!endDate || date <= endDate);
        const isWorkDay = rule.work_days.includes(date.getDay());
        return isInDateRange && isWorkDay;
      })
      .map(rule => rule.employee_id)
      .filter(Boolean);

    // Get employee names from checkins data
    const scheduledEmployeeNames = checkins
      .filter(checkin => scheduledEmployeeIds.includes(checkin.employee_id))
      .map(checkin => checkin.employees?.name)
      .filter((name, index, self) => name && self.indexOf(name) === index); // Remove duplicates and nulls

    // Add names from leave requests if not already included
    leaveRequests
      .filter(request => scheduledEmployeeIds.includes(request.employee_id))
      .forEach(request => {
        if (request.employee_name && !scheduledEmployeeNames.includes(request.employee_name)) {
          scheduledEmployeeNames.push(request.employee_name);
        }
      });

    // Add names from SOP records if not already included
    sopRecords
      .filter(record => scheduledEmployeeIds.includes(record.employee_id))
      .forEach(record => {
        if (record.employee?.name && !scheduledEmployeeNames.includes(record.employee.name)) {
          scheduledEmployeeNames.push(record.employee.name);
        }
      });

    return {
      checkins: filteredCheckins,
      workOrders: filteredWorkOrders,
      sopRecords: filteredSopRecords,
      leaveRequests: filteredLeaveRequests,
      isWorkDay: isWorkDay(date, scheduleRules),
      scheduledEmployees: scheduledEmployeeNames
    };
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDay(date);
      const hasEvents = Object.values({
        checkins: events.checkins,
        workOrders: events.workOrders,
        sopRecords: events.sopRecords,
        leaveRequests: events.leaveRequests
      }).some(arr => arr.length > 0);

      days.push(
        <div
          key={day}
          className={`h-32 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            events.isWorkDay ? 'bg-blue-50' : ''
          } ${hasEvents ? 'has-events' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">{day}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              events.scheduledEmployees.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {events.scheduledEmployees.length > 0 ? `${events.scheduledEmployees.length} on duty` : 'Off'}
            </span>
          </div>
          {events.scheduledEmployees.length > 0 && (
            <div className="mt-1 text-xs text-blue-700 font-medium">
              {events.scheduledEmployees.join(', ')}
            </div>
          )}
          <div className="mt-1 space-y-1">
            {events.checkins.length > 0 && (
              <div className="text-xs text-blue-600">
                {events.checkins.length} check-in{events.checkins.length !== 1 ? 's' : ''}
              </div>
            )}
            {events.workOrders.length > 0 && (
              <div className="text-xs text-green-600">
                {events.workOrders.length} work order{events.workOrders.length !== 1 ? 's' : ''}
              </div>
            )}
            {events.sopRecords.length > 0 && (
              <div className="text-xs text-purple-600">
                {events.sopRecords.length} SOP record{events.sopRecords.length !== 1 ? 's' : ''}
              </div>
            )}
            {events.leaveRequests.length > 0 && (
              <div className="text-xs text-yellow-600">
                {events.leaveRequests.length} leave request{events.leaveRequests.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-medium text-gray-900">{formatDate(currentDate)}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <DaySummaryModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          checkins={getEventsForDay(selectedDate).checkins}
          workOrders={getEventsForDay(selectedDate).workOrders}
          sopRecords={getEventsForDay(selectedDate).sopRecords}
          leaveRequests={getEventsForDay(selectedDate).leaveRequests}
          scheduledEmployees={getEventsForDay(selectedDate).scheduledEmployees}
          onIpClick={() => {}}
          onLeaveRequestAction={() => {}}
        />
      )}
    </div>
  );
};

export default CalendarView; 