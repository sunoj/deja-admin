/**
 * Table Structure:
 * admins:
 *   - id: uuid (primary key)
 * 
 * leave_requests:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - start_date: date
 *   - end_date: date
 *   - status: enum ('PENDING', 'APPROVED', 'REJECTED')
 *   - updated_at: timestamp
 * 
 * leave_balances:
 *   - id: uuid (primary key)
 *   - employee_id: uuid (foreign key)
 *   - leave_type_id: uuid (foreign key)
 *   - year: integer
 *   - used_days: integer
 * 
 * leave_types:
 *   - id: uuid (primary key)
 *   - name: string
 * 
 * Response Structure:
 * Success (200):
 * {
 *   "message": "Leave request status updated successfully"
 * }
 * 
 * Error Responses:
 * - 400: Missing required fields
 * - 401: Unauthorized (Admin not found)
 * - 404: Leave request not found
 * - 405: Method not allowed
 * - 500: Server error (Supabase config missing, update failed)
 */

import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../_shared/auth';

function getDaysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

async function handleApprove(context) {
  console.log('Starting leave approval process');
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  if (context.request.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method !== 'POST') {
    console.error('Invalid method:', context.request.method);
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
    console.log('Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { requestId, status } = await context.request.json();
    const adminId = context.user.id;

    console.log('Request parameters:', { requestId, status, adminId });

    if (!requestId || !status) {
      console.error('Missing required fields:', { requestId, status });
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Verify admin status
    console.log('Verifying admin status for ID:', adminId);
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', adminId)
      .single();

    if (adminError) {
      console.error('Admin verification error:', adminError);
    }

    if (adminError || !admin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Admin not found'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get leave request details
    console.log('Fetching leave request details for ID:', requestId);
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*, leave_types(name)')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Leave request fetch error:', fetchError);
    }

    if (fetchError || !leaveRequest) {
      return new Response(JSON.stringify({
        error: 'Leave request not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Current leave request:', leaveRequest);

    // If rejecting a previously approved request, restore the leave balance
    if (leaveRequest.status === 'APPROVED' && status === 'REJECTED') {
      console.log('Restoring leave balance for rejected request');
      const days = getDaysDifference(leaveRequest.start_date, leaveRequest.end_date);
      console.log('Days to restore:', days);

      const { error: balanceError } = await supabase
        .from('leave_balances')
        .update({
          used_days: supabase.rpc('decrement_used_days', { days_to_subtract: days })
        })
        .eq('employee_id', leaveRequest.employee_id)
        .eq('leave_type_id', leaveRequest.leave_type_id)
        .eq('year', new Date(leaveRequest.start_date).getFullYear());

      if (balanceError) {
        console.error('Leave balance update error:', balanceError);
        return new Response(JSON.stringify({
          error: 'Failed to update leave balance',
          details: balanceError.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Update leave request status
    console.log('Updating leave request status:', { requestId, status, adminId });
    const { data: updatedRequest, error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('*, leave_types(name)')
      .single();

    if (updateError) {
      console.error('Leave request update error:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to update leave request',
        details: updateError.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Successfully updated leave request:', updatedRequest);
    return new Response(JSON.stringify(updatedRequest), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Unexpected error in leave approval:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export const onRequest = withAuth(handleApprove); 