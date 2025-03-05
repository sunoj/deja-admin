import React, { useState } from 'react';
import { formatTime, getStatusClass, getStatusText } from '../services/api';
import DaySummaryModal from './DaySummaryModal';

function CalendarView({ checkins, workOrders, sopRecords, currentDate, selectedEmployee, onMonthChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState({
    checkins: [],
    workOrders: [],
    sopRecords: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleDayClick = (date, dayData) => {
    setSelectedDay(date);
    setSelectedDayData(dayData);
    setIsModalOpen(true);
  };

  const renderCalendarDays = () => {
    const days = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      days.push(
        <div key={`prev-${dayNumber}`} className="h-32 p-2 border border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-400">{dayNumber}</div>
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

      const dayWorkOrders = workOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayDate && orderDate < nextDay;
      });

      const daySopRecords = sopRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= dayDate && recordDate < nextDay;
      });

      const onTimeCount = dayCheckins.filter(checkin => 
        checkin.late_status === 'on_time' || checkin.late_status === 'perfect_on_time'
      ).length;
      const lateCount = dayCheckins.filter(checkin => 
        checkin.late_status === 'late_10' || checkin.late_status === 'late_15'
      ).length;
      const totalCheckins = dayCheckins.length;
      const totalWorkOrders = dayWorkOrders.length;
      const totalSopRecords = daySopRecords.length;

      days.push(
        <div
          key={`current-${i}`}
          className={`h-20 sm:h-32 p-0.5 sm:p-2 border border-gray-200 transition-colors duration-150 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50/50' : ''
          } ${
            isWeekend ? 'bg-gray-50/50' : ''
          }`}
          onClick={() => handleDayClick(dayDate, {
            checkins: dayCheckins,
            workOrders: dayWorkOrders,
            sopRecords: daySopRecords
          })}
        >
          <div className={`text-[10px] sm:text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{i}</div>
          {(totalCheckins > 0 || totalWorkOrders > 0 || totalSopRecords > 0) && (
            <div className="mt-0.5 space-y-0.5">
              {totalCheckins > 0 && (
                <div className="text-[8px] sm:text-xs">
                  {onTimeCount > 0 && (
                    <span className="text-green-600">
                      {onTimeCount} on time
                    </span>
                  )}
                  {lateCount > 0 && (
                    <span className="text-red-600 ml-0.5 sm:ml-1">
                      {lateCount} late
                    </span>
                  )}
                </div>
              )}
              {totalWorkOrders > 0 && (
                <div className="text-[8px] sm:text-xs text-blue-600">
                  {totalWorkOrders} work order{totalWorkOrders !== 1 ? 's' : ''}
                </div>
              )}
              {totalSopRecords > 0 && (
                <div className="text-[8px] sm:text-xs text-purple-600">
                  {totalSopRecords} SOP record{totalSopRecords !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Next month days
    const daysFromNextMonth = 42 - (firstDayIndex + daysInMonth);
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push(
        <div key={`next-${i}`} className="h-32 p-2 border border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-400">{i}</div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2 sm:mb-6">
        <button 
          onClick={handlePrevMonth}
          className="btn btn-secondary flex items-center gap-0.5 sm:gap-2 text-xs sm:text-base px-1.5 sm:px-3"
        >
          <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>
        <h2 className="text-sm sm:text-xl font-semibold text-gray-900">{monthName} {year}</h2>
        <button 
          onClick={handleNextMonth}
          className="btn btn-secondary flex items-center gap-0.5 sm:gap-2 text-xs sm:text-base px-1.5 sm:px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <svg width="12" height="12" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[1px] bg-gray-200 rounded-lg overflow-hidden">
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">S</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">M</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">T</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">W</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">T</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">F</div>
        <div className="p-0.5 sm:p-1 text-[10px] sm:text-xs font-medium text-center bg-white text-gray-600">S</div>
        {renderCalendarDays()}
      </div>

      <DaySummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDay}
        data={selectedDayData}
      />
    </div>
  );
}

export default CalendarView; 