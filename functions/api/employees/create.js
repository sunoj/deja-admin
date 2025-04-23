import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  // Get Supabase configuration from environment variables
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  // Return error if Supabase is not configured
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Handle OPTIONS request (CORS preflight)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Only allow POST requests
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    // Parse request body
    const { name, employment_status } = await context.request.json();
    
    if (!name) {
      return new Response(JSON.stringify({
        error: 'Name is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate 6-digit recovery code
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Get client IP address
    const ipAddress = getClientIp(context.request);
    
    // Get User Agent
    const userAgent = context.request.headers.get('user-agent') || '';
    
    // Create employee record
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        { 
          name, 
          recovery_code: recoveryCode,
          user_agent: userAgent,
          ip_address: ipAddress,
          is_deleted: false,
          employment_status: employment_status || 'active'
        }
      ])
      .select()
      .single();
    
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Return success response
    return new Response(JSON.stringify({
      employee,
      recoveryCode
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Get client IP address
function getClientIp(request) {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the list (original client IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  return '127.0.0.1';
} 