import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
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

    // Get request body
    const { title, description, assigned_to, images, priority } = await context.request.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return new Response(
        JSON.stringify({ error: 'Invalid priority value' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create work order with images
    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .insert({
        title,
        description,
        created_by: employeeId,
        assigned_to: assigned_to || employeeId,
        status: 'pending',
        priority: priority || 'normal',
        images: images || [] // Store images array directly in work_orders table
      })
      .select()
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create work order', details: orderError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Create status log
    await supabase
      .from('work_order_status_logs')
      .insert({
        work_order_id: order.id,
        status: 'pending',
        employee_id: employeeId
      });

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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
} 