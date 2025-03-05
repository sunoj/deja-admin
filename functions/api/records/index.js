// Cloudflare Worker function to handle records listing with pagination
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../../middleware/auth';

export async function onRequestGet(context) {
  try {
    // Initialize Supabase client with environment variables from context
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Content-Type': 'application/json'
    };

    // Get query parameters
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const showAll = url.searchParams.get('all') === 'true';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const filterEmployeeId = url.searchParams.get('employee_id');

    // Get employee_id from request headers
    const employeeId = context.request.headers.get('X-Employee-ID');
    const authHeader = context.request.headers.get('Authorization');

    // If no employee_id is provided, verify admin token
    if (!employeeId) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Admin authentication required' }),
          { status: 401, headers: corsHeaders }
        );
      }

      const token = authHeader.split(' ')[1];
      
      try {
        // Verify admin token using middleware
        await verifyAdminToken(supabase, token);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Create query builder
    let query = supabase
      .from('sop_records')
      .select('*, sop_workflows(id, name, description), employees(name)', { count: 'exact' })
      .gt('completed_items', 0);
    
    // Apply filters based on user type
    if (employeeId) {
      // User scenario: only show their own records
      query = query.eq('employee_id', employeeId);
    } else {
      // Admin scenario: can filter by employee if provided
      if (filterEmployeeId) {
        query = query.eq('employee_id', filterEmployeeId);
      }
    }
    
    // Apply date range filter if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false });

    // Execute the query
    const { data: records, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch records', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format the records
    const formattedRecords = (records || []).map(record => ({
      id: record.id,
      workflow_id: record.workflow_id,
      employee_id: record.employee_id,
      status: record.status,
      created_at: record.created_at,
      updated_at: record.updated_at,
      workflow: record.sop_workflows ? {
        id: record.sop_workflows.id,
        name: record.sop_workflows.name,
        description: record.sop_workflows.description
      } : null,
      employee: record.employees ? {
        name: record.employees.name
      } : null
    }));

    // Return the records with pagination info
    return new Response(
      JSON.stringify({
        records: formattedRecords,
        pagination: {
          total: count,
          page: page,
          limit: limit,
          pages: Math.ceil(count / limit)
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
} 