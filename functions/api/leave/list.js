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
 *     "updated_at": "timestamp"
 *   }
 * ]
 * 
 * Error Responses:
 * - 400: Missing required fields
 * - 405: Method not allowed
 * - 500: Server error (Supabase config missing, fetch failed)
 */

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { startDate, endDate, employeeId } = await context.request.json();

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({
        error: 'Start date and end date are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
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
        status,
        updated_at
      `)
      .gte('start_date', startDate)
      .lte('end_date', endDate);

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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
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
      status: request.status,
      updated_at: request.updated_at
    }));

    return new Response(JSON.stringify(transformedData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch leave requests',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 