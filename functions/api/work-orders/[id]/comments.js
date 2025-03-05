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

    // Get work order ID from URL
    const workOrderId = context.params.id;

    // Get request body
    const { content, images, new_status } = await context.request.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Comment content is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Start a transaction
    const { data: comment, error: commentError } = await supabase
      .from('work_order_comments')
      .insert({
        work_order_id: workOrderId,
        employee_id: employeeId,
        content,
        images: images || [],
        new_status
      })
      .select(`
        *,
        employee:employees!employee_id(name)
      `)
      .single();

    if (commentError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create comment', details: commentError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If there's a new status, update the work order
    if (new_status) {
      const { error: statusError } = await supabase
        .from('work_orders')
        .update({ status: new_status })
        .eq('id', workOrderId);

      if (statusError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update work order status', details: statusError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Create status log
      await supabase
        .from('work_order_status_logs')
        .insert({
          work_order_id: workOrderId,
          status: new_status,
          employee_id: employeeId
        });
    }

    return new Response(
      JSON.stringify({ comment }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle GET request to fetch comments
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

    // Get work order ID from URL
    const workOrderId = context.params.id;

    // Fetch comments with employee information
    const { data: comments, error } = await supabase
      .from('work_order_comments')
      .select(`
        *,
        employee:employees!employee_id(name)
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch comments', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ comments }),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Employee-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
} 