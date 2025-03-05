import { createClient } from '@supabase/supabase-js';

export async function onRequestPut(context) {
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
    const { status } = await context.request.json();

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'Status is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update work order status
    const { data: order, error } = await supabase
      .from('work_orders')
      .update({ status })
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update work order status', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Create status log
    await supabase
      .from('work_order_status_logs')
      .insert({
        work_order_id: workOrderId,
        status,
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