/**
 * Table Structure:
 * leave_requests:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - start_date: date
 *   - end_date: date
 *   - reason: text
 *   - medical_certificate_url: string (nullable)
 *   - status: enum ('PENDING', 'APPROVED', 'REJECTED')
 * 
 * leave_balances:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - year: integer
 *   - total_days: integer
 *   - used_days: integer
 * 
 * leave_types:
 *   - id: uuid (primary key)
 *   - name: string
 * 
 * Request Body Structure:
 * {
 *   "employeeId": "uuid",
 *   "leaveTypeId": "uuid",
 *   "startDate": "YYYY-MM-DD",
 *   "endDate": "YYYY-MM-DD",
 *   "reason": "string",
 *   "medicalCertificateUrl": "string" (optional)
 * }
 * 
 * Response Structure:
 * Success (201):
 * {
 *   "id": "uuid",
 *   "employee_id": "uuid",
 *   "leave_type_id": "uuid",
 *   "start_date": "YYYY-MM-DD",
 *   "end_date": "YYYY-MM-DD",
 *   "reason": "string",
 *   "medical_certificate_url": "string",
 *   "status": "PENDING"
 * }
 * 
 * Error Responses:
 * - 400: Missing required fields, Invalid Content-Type, Insufficient leave balance
 * - 404: Leave balance not found
 * - 405: Method not allowed
 * - 500: Server error (Supabase config missing, create/update failed)
 */

import { createClient } from '@supabase/supabase-js';

function getDaysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json'
};

export async function onRequest(context) {
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Check Content-Type header
    const contentType = context.request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'Invalid Content-Type. Expected application/json'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { 
      employeeId, 
      leaveTypeId, 
      startDate, 
      endDate, 
      reason,
      medicalCertificateUrl 
    } = await context.request.json();

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate number of days
    const days = getDaysDifference(startDate, endDate);

    // Check if medical certificate is required for sick leave
    const { data: leaveType } = await supabase
      .from('leave_types')
      .select('name')
      .eq('id', leaveTypeId)
      .single();

    // For PERSONAL_LEAVE, skip balance check
    let balance;
    if (leaveType?.name !== 'PERSONAL_LEAVE') {
      // Check leave balance
      const { data: balanceData } = await supabase
        .from('leave_balances')
        .select('total_days, used_days')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('year', new Date().getFullYear())
        .single();

      if (!balanceData) {
        return new Response(JSON.stringify({
          error: 'Leave balance not found'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      balance = balanceData;
      const remainingDays = balance.total_days - balance.used_days;
      if (days > remainingDays) {
        return new Response(JSON.stringify({
          error: `Insufficient leave balance. Available: ${remainingDays} days, Requested: ${days} days`
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    // Create leave request
    const { data: leaveRequest, error: leaveError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
        medical_certificate_url: medicalCertificateUrl,
        status: 'PENDING'
      })
      .select()
      .single();

    if (leaveError) {
      return new Response(JSON.stringify({
        error: 'Failed to create leave request',
        details: leaveError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(leaveRequest), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to process leave request',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
} 