import React from 'react';
import { formatTime, getStatusClass, getStatusText } from '../services/api';

function CalendarView({ checkins, currentDate, selectedEmployee, onMonthChange }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayIndex = firstDay.getDay();
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const daysInMonth = lastDay.getDate();
  const today = new Date();

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long'
  });

  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1));
  };

  const renderCalendarDays = () => {
    const days = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      days.push(
        <div key={`prev-${dayNumber}`} className="h-32 p-2 border border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">{dayNumber}</div>
        </div>
      );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isToday = year === today.getFullYear() && month === today.getMonth() && i === today.getDate();
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const nextDay = new Date(year, month, i + 1);

      const dayCheckins = checkins.filter(checkin => {
        const checkinDate = new Date(checkin.created_at);
        const isOnDay = checkinDate >= dayDate && checkinDate < nextDay;
        
        if (selectedEmployee === 'all') {
          return isOnDay;
        } else {
          return isOnDay && checkin.employee_id === selectedEmployee;
        }
      });

      days.push(
        <div
          key={`current-${i}`}
          className={`h-32 p-2 border border-gray-200 ${
            isToday ? 'bg-blue-50' : ''
          } ${
            isWeekend ? 'bg-gray-50' : ''
          }`}
        >
          <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{i}</div>
          {dayCheckins.map(checkin => {
            const checkinTime = formatTime(checkin.created_at);
            const employeeName = checkin.employees ? checkin.employees.name : 'Unknown';
            const statusClass = getStatusClass(checkin.late_status);
            const status = getStatusText(checkin.late_status);
            const penalty = checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '0%';
            const exemption = checkin.exemption_applied ? 'Yes' : 'No';

            return (
              <div
                key={checkin.id}
                className={`text-xs p-1 mb-1 rounded ${statusClass}`}
                title={`${employeeName}\nStatus: ${status}\nPenalty: ${penalty}\nExemption: ${exemption}`}
              >
                {checkinTime} - {employeeName}
              </div>
            );
          })}
        </div>
      );
    }

    // Next month days
    const daysFromNextMonth = 42 - (firstDayIndex + daysInMonth);
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push(
        <div key={`next-${i}`} className="h-32 p-2 border border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">{i}</div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handlePrevMonth}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Previous
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{monthName} {year}</h2>
        <button 
          onClick={handleNextMonth}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        <div className="p-2 text-sm font-medium text-center bg-white">Sun</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Mon</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Tue</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Wed</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Thu</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Fri</div>
        <div className="p-2 text-sm font-medium text-center bg-white">Sat</div>
        {renderCalendarDays()}
      </div>
    </div>
  );
}

export default CalendarView; 