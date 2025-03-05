// Cloudflare Worker function to handle employees listing
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
    
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Query employees with pagination
    const { data: employees, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch employees', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format the employees (remove sensitive data)
    const formattedEmployees = (employees || []).map(employee => ({
      id: employee.id,
      name: employee.name,
      created_at: employee.created_at,
      updated_at: employee.updated_at
    }));

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Return the employees with pagination info
    return new Response(
      JSON.stringify({
        employees: formattedEmployees,
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 