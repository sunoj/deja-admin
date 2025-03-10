import React, { useState, useEffect } from 'react';
import { CalendarViewProps } from '../types/components';
import DaySummaryModal from './DaySummaryModal';

const CalendarView: React.FC<CalendarViewProps> = ({
  checkins,
  workOrders,
  sopRecords,
  leaveRequests,
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
      currentDate,
      selectedEmployee,
      sampleData: {
        checkins: checkins?.slice(0, 2).map(c => ({
          id: c.id,
          created_at: c.created_at,
          date: new Date(c.created_at).toLocaleString()
        })),
        workOrders: workOrders?.slice(0, 2).map(w => ({
          id: w.id,
          created_at: w.created_at,
          date: new Date(w.created_at).toLocaleString()
        })),
        sopRecords: sopRecords?.slice(0, 2).map(s => ({
          id: s.id,
          created_at: s.created_at,
          date: new Date(s.created_at).toLocaleString()
        })),
        leaveRequests: leaveRequests?.slice(0, 2).map(l => ({
          id: l.id,
          start_date: l.start_date,
          end_date: l.end_date,
          start: new Date(l.start_date).toLocaleString(),
          end: new Date(l.end_date).toLocaleString()
        }))
      }
    });
  }, [checkins, workOrders, sopRecords, leaveRequests, currentDate, selectedEmployee]);

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

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    console.log('Comparing dates for:', date.toISOString());
    console.log('Day start:', dayStart.toISOString());
    console.log('Day end:', dayEnd.toISOString());

    const filteredCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.created_at);
      const isAfterStart = checkinDate >= dayStart;
      const isBeforeEnd = checkinDate <= dayEnd;
      console.log('Checkin comparison:', {
        id: checkin.id,
        date: checkinDate.toISOString(),
        isAfterStart,
        isBeforeEnd
      });
      return isAfterStart && isBeforeEnd;
    });

    const filteredWorkOrders = workOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const isAfterStart = orderDate >= dayStart;
      const isBeforeEnd = orderDate <= dayEnd;
      console.log('Work order comparison:', {
        id: order.id,
        date: orderDate.toISOString(),
        isAfterStart,
        isBeforeEnd
      });
      return isAfterStart && isBeforeEnd;
    });

    const filteredSopRecords = sopRecords.filter(record => {
      const recordDate = new Date(record.created_at);
      const isAfterStart = recordDate >= dayStart;
      const isBeforeEnd = recordDate <= dayEnd;
      console.log('SOP record comparison:', {
        id: record.id,
        date: recordDate.toISOString(),
        isAfterStart,
        isBeforeEnd
      });
      return isAfterStart && isBeforeEnd;
    });

    const filteredLeaveRequests = leaveRequests.filter(request => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const isAfterStart = startDate <= dayEnd;
      const isBeforeEnd = endDate >= dayStart;
      console.log('Leave request comparison:', {
        id: request.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAfterStart,
        isBeforeEnd
      });
      return isAfterStart && isBeforeEnd;
    });

    console.log('Filtered results:', {
      checkins: filteredCheckins.length,
      workOrders: filteredWorkOrders.length,
      sopRecords: filteredSopRecords.length,
      leaveRequests: filteredLeaveRequests.length
    });

    return {
      checkins: filteredCheckins,
      workOrders: filteredWorkOrders,
      sopRecords: filteredSopRecords,
      leaveRequests: filteredLeaveRequests
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
      const hasEvents = Object.values(events).some(arr => arr.length > 0);

      // Debug logging for day rendering
      if (hasEvents) {
        console.log('Day has events:', {
          date: date.toLocaleString(),
          events: {
            checkins: events.checkins.length,
            workOrders: events.workOrders.length,
            sopRecords: events.sopRecords.length,
            leaveRequests: events.leaveRequests.length
          }
        });
      }

      days.push(
        <div
          key={day}
          className={`h-32 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            hasEvents ? 'bg-blue-50' : ''
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="font-medium text-gray-900">{day}</div>
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
          onIpClick={() => {}}
          onLeaveRequestAction={() => {}}
        />
      )}
    </div>
  );
};

export default CalendarView; 