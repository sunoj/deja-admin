import React from 'react';
import { formatDate, formatTime } from '../services/api';

function DownloadButton({ checkins, workOrders, sopRecords, leaveRequests, selectedEmployee, currentDate }) {
  const handleDownload = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long'
    });

    // Prepare data for each type
    const checkinsData = checkins.map(checkin => ({
      Date: formatDate(new Date(checkin.created_at)),
      Time: formatTime(new Date(checkin.created_at)),
      Employee: checkin.employees?.name || 'Unknown',
      Status: checkin.late_status,
      Penalty: checkin.penalty_percentage ? `${checkin.penalty_percentage}%` : '0%',
      Exemption: checkin.exemption_applied ? 'Yes' : 'No',
      IP: checkin.ip_address
    }));

    const workOrdersData = workOrders.map(order => ({
      Date: formatDate(new Date(order.created_at)),
      Time: formatTime(new Date(order.created_at)),
      Title: order.title,
      Description: order.description,
      Status: order.status,
      Priority: order.priority,
      Assignee: order.assignee?.name || 'Unassigned'
    }));

    const sopRecordsData = sopRecords.map(record => ({
      Date: formatDate(new Date(record.created_at)),
      Time: formatTime(new Date(record.created_at)),
      Employee: record.employee?.name || 'Unknown',
      Workflow: record.workflow?.name || 'Unknown',
      Status: record.status
    }));

    const leaveRequestsData = leaveRequests.map(request => ({
      Employee: request.employee_name,
      LeaveType: request.leave_type_name,
      StartDate: formatDate(new Date(request.start_date)),
      EndDate: formatDate(new Date(request.end_date)),
      Status: request.status,
      UpdatedAt: formatDate(new Date(request.updated_at))
    }));

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DEJA Admin';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Add sheets
    if (checkinsData.length > 0) {
      const checkinsSheet = workbook.addWorksheet('Check-ins');
      checkinsSheet.columns = [
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Time', key: 'Time', width: 15 },
        { header: 'Employee', key: 'Employee', width: 20 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Penalty', key: 'Penalty', width: 10 },
        { header: 'Exemption', key: 'Exemption', width: 10 },
        { header: 'IP', key: 'IP', width: 15 }
      ];
      checkinsData.forEach(row => checkinsSheet.addRow(row));
    }

    if (workOrdersData.length > 0) {
      const workOrdersSheet = workbook.addWorksheet('Work Orders');
      workOrdersSheet.columns = [
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Time', key: 'Time', width: 15 },
        { header: 'Title', key: 'Title', width: 30 },
        { header: 'Description', key: 'Description', width: 40 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Priority', key: 'Priority', width: 10 },
        { header: 'Assignee', key: 'Assignee', width: 20 }
      ];
      workOrdersData.forEach(row => workOrdersSheet.addRow(row));
    }

    if (sopRecordsData.length > 0) {
      const sopRecordsSheet = workbook.addWorksheet('SOP Records');
      sopRecordsSheet.columns = [
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Time', key: 'Time', width: 15 },
        { header: 'Employee', key: 'Employee', width: 20 },
        { header: 'Workflow', key: 'Workflow', width: 30 },
        { header: 'Status', key: 'Status', width: 15 }
      ];
      sopRecordsData.forEach(row => sopRecordsSheet.addRow(row));
    }

    if (leaveRequestsData.length > 0) {
      const leaveRequestsSheet = workbook.addWorksheet('Leave Requests');
      leaveRequestsSheet.columns = [
        { header: 'Employee', key: 'Employee', width: 20 },
        { header: 'Leave Type', key: 'LeaveType', width: 15 },
        { header: 'Start Date', key: 'StartDate', width: 15 },
        { header: 'End Date', key: 'EndDate', width: 15 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Updated At', key: 'UpdatedAt', width: 15 }
      ];
      leaveRequestsData.forEach(row => leaveRequestsSheet.addRow(row));
    }

    // Generate filename
    const employeeFilter = selectedEmployee === 'all' ? 'All Employees' : 
      checkins.find(c => c.employee_id === selectedEmployee)?.employees?.name || 'Unknown Employee';
    const filename = `${monthName}_${year}_${employeeFilter.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    // Save file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <button
      onClick={handleDownload}
      className="btn btn-primary flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Excel
    </button>
  );
}

export default DownloadButton; 