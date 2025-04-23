import React, { useState, useEffect } from 'react';
import { dataApi } from '../services/api';
import { Employee, Checkin } from '../types/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState<string>('');
  const [newEmployeeStatus, setNewEmployeeStatus] = useState<string>('active');
  
  // Employment status options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'terminated', label: 'Terminated' }
  ];

  // Load employees on component mount and when showDeleted changes
  useEffect(() => {
    fetchEmployees();
  }, [showDeleted]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await dataApi.getEmployees(showDeleted);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection to view details
  const handleEmployeeSelect = async (employee: Employee) => {
    try {
      const detailedEmployee = await dataApi.getEmployee(employee.id);
      setSelectedEmployee(detailedEmployee);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
    }
  };

  // Handle status change
  const handleStatusChange = async (employee: Employee, status: string) => {
    try {
      await dataApi.updateEmployee(employee.id, { employment_status: status });
      toast.success(`Employee status updated to ${status}`);
      fetchEmployees();
      if (selectedEmployee && selectedEmployee.id === employee.id) {
        const updated = await dataApi.getEmployee(employee.id);
        setSelectedEmployee(updated);
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  // Handle soft delete
  const handleSoftDelete = async (employee: Employee) => {
    try {
      await dataApi.updateEmployee(employee.id, { is_deleted: true });
      toast.success('Employee has been archived');
      fetchEmployees();
      if (selectedEmployee && selectedEmployee.id === employee.id) {
        setSelectedEmployee(null);
      }
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast.error('Failed to archive employee');
    }
  };

  // Handle restore
  const handleRestore = async (employee: Employee) => {
    try {
      await dataApi.updateEmployee(employee.id, { is_deleted: false });
      toast.success('Employee has been restored');
      fetchEmployees();
    } catch (error) {
      console.error('Error restoring employee:', error);
      toast.error('Failed to restore employee');
    }
  };

  // Handle creating a new employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) {
      toast.error('Employee name is required');
      return;
    }

    try {
      await dataApi.createEmployee(newEmployeeName, newEmployeeStatus);
      toast.success('Employee created successfully');
      setNewEmployeeName('');
      setNewEmployeeStatus('active');
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
      
      {/* Add new employee form */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
        <form onSubmit={handleCreateEmployee} className="flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Employee Name"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="w-64">
            <select
              value={newEmployeeStatus}
              onChange={(e) => setNewEmployeeStatus(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Employee
          </button>
        </form>
      </div>
      
      {/* Employee listing */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Employees</h2>
            <div className="flex items-center">
              <label className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={() => setShowDeleted(!showDeleted)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Show Archived</span>
              </label>
              <button 
                onClick={fetchEmployees} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white shadow-md rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map(employee => (
                      <tr 
                        key={employee.id} 
                        className={`${employee.is_deleted ? 'bg-red-50' : ''} hover:bg-gray-50 cursor-pointer`}
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${employee.employment_status === 'active' ? 'bg-green-100 text-green-800' : 
                            employee.employment_status === 'terminated' ? 'bg-red-100 text-red-800' : 
                            employee.employment_status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                            {employee.employment_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                            <select
                              value={employee.employment_status}
                              onChange={(e) => handleStatusChange(employee, e.target.value)}
                              className="text-xs border rounded p-1"
                              disabled={employee.is_deleted}
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {employee.is_deleted ? (
                              <button
                                onClick={() => handleRestore(employee)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSoftDelete(employee)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Employee details */}
        <div className="md:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Employee Details</h2>
          {selectedEmployee ? (
            <div className="bg-white shadow-md rounded p-4">
              <h3 className="text-lg font-medium">{selectedEmployee.name}</h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="font-medium">Status:</span> {selectedEmployee.employment_status.replace('_', ' ')}
                </p>
                <p>
                  <span className="font-medium">Created:</span> {formatDate(selectedEmployee.created_at)}
                </p>
                <p>
                  <span className="font-medium">Last Updated:</span> {formatDate(selectedEmployee.updated_at)}
                </p>
                
                {/* Recent check-ins */}
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Recent Check-ins</h4>
                  {selectedEmployee.recent_checkins && selectedEmployee.recent_checkins.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedEmployee.recent_checkins.map((checkin: Checkin) => (
                            <tr key={checkin.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(checkin.created_at)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${checkin.late_status === 'perfect_on_time' ? 'bg-green-100 text-green-800' : 
                                  checkin.late_status === 'on_time' ? 'bg-blue-100 text-blue-800' : 
                                  checkin.late_status === 'late_10' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                  {checkin.late_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {checkin.penalty_percentage > 0 ? 
                                  `${checkin.penalty_percentage}%${checkin.exemption_applied ? ' (exempted)' : ''}` : 
                                  'None'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No recent check-ins found</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 shadow-md rounded p-4 text-center text-gray-400">
              Select an employee to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement; 