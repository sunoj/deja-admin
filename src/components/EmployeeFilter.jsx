import React from 'react';

function EmployeeFilter({ employees, selectedEmployee, onChange }) {
  return (
    <div className="flex items-center space-x-3">
      <label htmlFor="employee-select" className="text-sm font-medium text-gray-700">
        Filter by Employee:
      </label>
      <select
        id="employee-select"
        value={selectedEmployee}
        onChange={(e) => onChange(e.target.value)}
        className="input w-64"
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