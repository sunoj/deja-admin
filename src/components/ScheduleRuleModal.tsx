import React, { useState, useEffect } from 'react';
import { ScheduleRule, Employee } from '../types/api';

interface ScheduleRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSave: (rule: Omit<ScheduleRule, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  existingRule?: ScheduleRule;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleRuleModal: React.FC<ScheduleRuleModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSave,
  existingRule
}) => {
  const [name, setName] = useState(existingRule?.name || '');
  const [isDefault, setIsDefault] = useState(existingRule?.is_default || false);
  const [workDays, setWorkDays] = useState<number[]>(existingRule?.work_days || [1, 2, 3, 4, 5]); // Mon-Fri by default
  const [startDate, setStartDate] = useState(existingRule?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existingRule?.end_date || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingRule) {
      setName(existingRule.name);
      setIsDefault(existingRule.is_default);
      setWorkDays(existingRule.work_days);
      setStartDate(existingRule.start_date);
      setEndDate(existingRule.end_date || '');
    }
  }, [existingRule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a rule name');
      return;
    }

    if (!workDays.length) {
      setError('Please select at least one work day');
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    try {
      await onSave({
        employee_id: employee?.id || '',
        name,
        is_default: isDefault,
        work_days: workDays,
        start_date: startDate,
        end_date: endDate || null
      });
      onClose();
    } catch (err) {
      setError('Failed to save schedule rule');
    }
  };

  const toggleDay = (day: number) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter(d => d !== day));
    } else {
      setWorkDays([...workDays, day].sort());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{existingRule ? 'Edit Schedule Rule' : 'New Schedule Rule'}</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Work Days</label>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`p-2 text-xs rounded ${
                    workDays.includes(index)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Set as default schedule
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleRuleModal; 