import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  try {
    // Initialize Supabase client
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Content-Type': 'application/json'
    };

    // Get employee_id from request headers
    const employeeId = context.request.headers.get('X-Employee-ID');
    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Get pagination parameters from query
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const showAll = url.searchParams.get('all') === 'true';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Create query builder
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        creator:employees!created_by(name),
        assignee:employees!assigned_to(name)
      `, { count: 'exact' });
    
    // Only filter by employee if not showing all
    if (!showAll) {
      query = query.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
    }
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute the query
    const { data: orders, error, count } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Return the orders with pagination info
    return new Response(
      JSON.stringify({
        orders,
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
} 