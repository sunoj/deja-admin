/**
 * Table Structure:
 * employees:
 *   - id: uuid (primary key)
 *   - hire_date: date
 *   - employee_type: enum ('FULL_TIME', 'PART_TIME')
 * 
 * leave_balances:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - year: integer
 *   - total_days: integer
 *   - accrued_days: integer
 *   - used_days: integer
 *   - last_accrual_date: timestamp
 * 
 * leave_types:
 *   - id: uuid (primary key)
 *   - name: string
 *   - description: string
 *   - annual_days: integer
 *   - monthly_accrual_rate: decimal
 * 
 * Response Structure:
 * Success (200):
 * [
 *   {
 *     "id": "uuid",
 *     "leave_type_id": "uuid",
 *     "total_days": number,
 *     "used_days": number,
 *     "accrued_days": number,
 *     "leave_types": {
 *       "name": string,
 *       "description": string,
 *       "annual_days": number,
 *       "monthly_accrual_rate": number
 *     }
 *   }
 * ]
 * 
 * Error Responses:
 * - 400: Employee ID is required
 * - 404: Employee not found
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
    const { employeeId } = await context.request.json();

    if (!employeeId) {
      return new Response(JSON.stringify({
        error: 'Employee ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // First, check if the employee exists and get their hire date
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, hire_date, employee_type')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return new Response(JSON.stringify({
        error: 'Employee not found',
        details: employeeError?.message
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check if leave balances exist for the current year
    const currentYear = new Date().getFullYear();
    const { data: existingBalances, error: balanceCheckError } = await supabase
      .from('leave_balances')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('year', currentYear);

    // If no balances exist for the current year and employee is full-time, initialize them
    if ((!existingBalances || existingBalances.length === 0) && employee.employee_type === 'FULL_TIME') {
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('*')
        .in('name', ['PAID_LEAVE', 'SICK_LEAVE']);

      // Initialize leave balances for the current year
      for (const leaveType of leaveTypes || []) {
        await supabase
          .from('leave_balances')
          .insert({
            employee_id: employeeId,
            leave_type_id: leaveType.id,
            year: currentYear,
            total_days: leaveType.annual_days,
            accrued_days: 0,
            used_days: 0,
            last_accrual_date: null
          });
      }
    }

    // Update accrued days
    await supabase.rpc('update_leave_accrual');

    // Get updated balances
    const { data: balances, error: fetchError } = await supabase
      .from('leave_balances')
      .select(`
        id,
        leave_type_id,
        total_days,
        used_days,
        accrued_days,
        leave_types (
          name,
          description,
          annual_days,
          monthly_accrual_rate
        )
      `)
      .eq('employee_id', employeeId)
      .eq('year', currentYear);

    if (fetchError) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch leave balances',
        details: fetchError.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Log the response for debugging
    console.log('Leave balances response:', {
      employeeId,
      year: currentYear,
      balancesCount: balances?.length || 0,
      balances
    });

    return new Response(JSON.stringify(balances || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error in leave balance API:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch leave balances',
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