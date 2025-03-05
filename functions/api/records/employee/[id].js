// Cloudflare Worker function to handle employee SOP records
import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  
  console.log(`Handling employee records request for employee ${params.id}`);
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Common response headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  // Initialize Supabase client
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      allowedMethods: ['GET']
    }), {
      status: 405,
      headers: {
        ...headers,
        'Allow': 'GET, OPTIONS'
      }
    });
  }
  
  const employeeId = params.id;
  
  // Parse pagination parameters from URL query params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;
  
  try {
    // First, get the total count of records for this employee
    const { count, error: countError } = await supabase
      .from('sop_records')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeId);
      
    if (countError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch record count', details: countError.message }),
        { status: 500, headers }
      );
    }
    
    // Then get the paginated records
    const { data, error } = await supabase
      .from('sop_records')
      .select('*, sop_workflows(name), employees(name)')
      .eq('employee_id', employeeId)
      .gt('completed_items', 0)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch records', details: error.message }),
        { status: 500, headers }
      );
    }
    
    // Return the data with pagination metadata
    return new Response(
      JSON.stringify({
        data: data,
        metadata: {
          total: count,
          total_pages: Math.ceil(count / limit),
          current_page: page,
          per_page: limit
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
} 