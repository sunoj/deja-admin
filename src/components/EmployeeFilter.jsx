import React from 'react';

function EmployeeFilter({ employees, selectedEmployee, onChange }) {
  return (
    <div className="employee-filter">
      <label htmlFor="employee-select">Filter by Employee:</label>
      <select
        id="employee-select"
        value={selectedEmployee}
        onChange={(e) => onChange(e.target.value)}
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