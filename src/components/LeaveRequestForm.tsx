import React, { useState, useEffect } from 'react';
import { dataApi } from '../services/api';
import { Employee } from '../types/api';
import { toast } from 'react-toastify';

interface LeaveType {
  id: string;
  name: string;
}

interface LeaveRequestFormProps {
  employees: Employee[];
  onRequestCreated: () => void;
  preselectedEmployeeId?: string;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ 
  employees, 
  onRequestCreated,
  preselectedEmployeeId 
}) => {
  const [employeeId, setEmployeeId] = useState<string>(preselectedEmployeeId || '');
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (preselectedEmployeeId) {
      setEmployeeId(preselectedEmployeeId);
    }
  }, [preselectedEmployeeId]);

  const fetchLeaveTypes = async () => {
    try {
      const leaveTypesData = await dataApi.fetchLeaveTypes();
      setLeaveTypes(leaveTypesData);
      if (leaveTypesData.length > 0) {
        setLeaveTypeId(leaveTypesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast.error('Failed to load leave types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsLoading(true);
    try {
      await dataApi.createLeaveRequest(
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        reason,
        medicalCertificateUrl || undefined
      );
      
      toast.success('Leave request submitted successfully');
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setMedicalCertificateUrl('');
      
      // Notify parent component
      onRequestCreated();
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setIsLoading(false);
    }
  };

  // Format leave type name for display
  const formatLeaveTypeName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="bg-white shadow-md rounded p-4">
      <h2 className="text-xl font-semibold mb-4">Submit Leave Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee *
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={!!preselectedEmployeeId}
          >
            <option value="">Select Employee</option>
            {employees
              .filter(emp => !emp.is_deleted && emp.employment_status !== 'terminated')
              .map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type *
          </label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {formatLeaveTypeName(type.name)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medical Certificate URL (if applicable)
          </label>
          <input
            type="text"
            value={medicalCertificateUrl}
            onChange={(e) => setMedicalCertificateUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://example.com/certificate.pdf"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm; 