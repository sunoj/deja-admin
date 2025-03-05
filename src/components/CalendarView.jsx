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
        <div key={`prev-${dayNumber}`} className="calendar-day other-month">
          <div className="calendar-day-number">{dayNumber}</div>
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
          className={`calendar-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
        >
          <div className="calendar-day-number">{i}</div>
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
                className={`checkin-entry ${statusClass}`}
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
        <div key={`next-${i}`} className="calendar-day other-month">
          <div className="calendar-day-number">{i}</div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-view active">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Previous
        </button>
        <h2>{monthName} {year}</h2>
        <button onClick={handleNextMonth}>
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="calendar">
        <div className="calendar-day-header">Sun</div>
        <div className="calendar-day-header">Mon</div>
        <div className="calendar-day-header">Tue</div>
        <div className="calendar-day-header">Wed</div>
        <div className="calendar-day-header">Thu</div>
        <div className="calendar-day-header">Fri</div>
        <div className="calendar-day-header">Sat</div>
        {renderCalendarDays()}
      </div>
    </div>
  );
}

export default CalendarView; 