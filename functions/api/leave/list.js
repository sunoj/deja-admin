/**
 * Table Structure:
 * leave_requests:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - start_date: date
 *   - end_date: date
 *   - status: enum ('PENDING', 'APPROVED', 'REJECTED')
 *   - updated_at: timestamp
 *   - is_half_day: boolean (default: false)
 *   - half_day_type: string (nullable, 'AM' or 'PM')
 * 
 * leave_types:
 *   - id: uuid (primary key)
 *   - name: string
 * 
 * employees:
 *   - id: uuid (primary key)
 *   - name: string
 * 
 * Response Structure:
 * Success (200):
 * [
 *   {
 *     "id": "uuid",
 *     "employee_id": "uuid",
 *     "employee_name": "string",
 *     "leave_type_id": "uuid",
 *     "leave_type_name": "string",
 *     "start_date": "YYYY-MM-DD",
 *     "end_date": "YYYY-MM-DD",
 *     "status": "PENDING|APPROVED|REJECTED",
 *     "updated_at": "timestamp",
 *     "is_half_day": boolean,
 *     "half_day_type": string
 *   }
 * ]
 * 
 * Error Responses:
 * - 400: Missing required fields
 * - 405: Method not allowed
 * - 500: Server error (Supabase config missing, fetch failed)
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../../middleware/auth';

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin token
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      await verifyAdminToken(token, supabase);
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Get parameters from URL query string
    const url = new URL(context.request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const employeeId = url.searchParams.get('employee_id');

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({
        error: 'Start date and end date are required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let query = supabase
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        employees (
          name
        ),
        leave_type_id,
        leave_types (
          name
        ),
        start_date,
        end_date,
        reason,
        status,
        medical_certificate_url,
        is_half_day,
        half_day_type,
        created_at,
        updated_at
      `)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (employeeId && employeeId !== 'all') {
      query = query.eq('employee_id', employeeId);
    }

    const { data: leaveRequests, error: fetchError } = await query;

    if (fetchError) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch leave requests',
        details: fetchError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Transform the data to include employee and leave type names
    const transformedData = leaveRequests.map(request => ({
      id: request.id,
      employee_id: request.employee_id,
      employee_name: request.employees?.name || 'Unknown',
      leave_type_id: request.leave_type_id,
      leave_type_name: request.leave_types?.name || 'Unknown',
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
      status: request.status,
      medical_certificate_url: request.medical_certificate_url,
      is_half_day: request.is_half_day || false,
      half_day_type: request.half_day_type || null,
      created_at: request.created_at,
      updated_at: request.updated_at
    }));

    return new Response(JSON.stringify({ leave_requests: transformedData }), {
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch leave requests',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
} 