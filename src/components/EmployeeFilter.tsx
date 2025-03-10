import React from 'react';
import { EmployeeFilterProps } from '../types/components';

const EmployeeFilter: React.FC<EmployeeFilterProps> = ({ employees, selectedEmployee, onChange }) => {
  return (
    <select
      value={selectedEmployee}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    >
      <option value="all">All Employees</option>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.name}
        </option>
      ))}
    </select>
  );
};

export default EmployeeFilter; 