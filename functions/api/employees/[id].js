// Cloudflare Worker function to handle single employee retrieval
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

    // Extract the employee ID from the URL
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const employeeId = pathParts[pathParts.length - 1]; // Get the ID from /api/employees/[id]

    // Get the employee details
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, name, created_at, updated_at, is_deleted, employment_status')
      .eq('id', employeeId)
      .single();

    if (error || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get recent check-ins (last 5)
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Return the employee with recent check-ins
    return new Response(
      JSON.stringify({
        ...employee,
        recent_checkins: recentCheckins || []
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

export async function onRequestPut(context) {
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

    // Extract the employee ID from the URL
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const employeeId = pathParts[pathParts.length - 1];

    // Parse the request body
    const requestData = await context.request.json();
    
    // Prepare update data
    const updateData = {};
    
    // Check which fields to update
    if (requestData.is_deleted !== undefined) {
      updateData.is_deleted = requestData.is_deleted;
    }
    
    if (requestData.employment_status !== undefined) {
      updateData.employment_status = requestData.employment_status;
    }
    
    if (requestData.name !== undefined) {
      updateData.name = requestData.name;
    }
    
    // Update the employee
    const { data: updatedEmployee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select('id, name, created_at, updated_at, is_deleted, employment_status');
      
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update employee', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!updatedEmployee || updatedEmployee.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Employee not found' }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Return the updated employee
    return new Response(
      JSON.stringify(updatedEmployee[0]),
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 