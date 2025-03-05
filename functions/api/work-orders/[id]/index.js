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

    // Get work order ID from URL
    const workOrderId = context.params.id;

    // Fetch work order with related data
    const { data: order, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        creator:employees!created_by(name),
        assignee:employees!assigned_to(name),
        comments:work_order_comments(
          *,
          employee:employees(name)
        )
      `)
      .eq('id', workOrderId)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch work order', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Work order not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ order }),
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