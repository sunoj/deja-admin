// Cloudflare Worker function to handle records listing with pagination
import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  try {
    // Initialize Supabase client with environment variables from context
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Get pagination parameters from query
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');

    // Get employee_id from request headers
    const employeeId = context.request.headers.get('X-Employee-ID');
    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Create query builder
    let query = supabase
      .from('sop_records')
      .select('*, sop_workflows(id, name, description), employees(name)', { count: 'exact' })
      .gt('completed_items', 0)
      .eq('employee_id', employeeId); // Filter by current employee
    
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
      } : null
    }));

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Return the records with pagination info
    return new Response(
      JSON.stringify({
        records: formattedRecords,
        pagination: {
          total: count,
          page: page,
          limit: limit,
          pages: totalPages
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