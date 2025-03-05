import React from 'react';

function EmployeeFilter({ employees, selectedEmployee, onChange }) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="employee-select" className="text-sm font-medium text-gray-700">
        Filter by Employee:
      </label>
      <select
        id="employee-select"
        value={selectedEmployee}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="all">All Employees</option>
        {employees.map(employee => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default EmployeeFilter; 