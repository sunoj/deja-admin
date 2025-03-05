import { createClient } from '@supabase/supabase-js';

// Web Crypto API for password hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', passwordData);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  // Get Supabase configuration from environment variables
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  const allowRegistration = context.env.ALLOW_REGISTRATION === 'true';
  
  // Check if registration is allowed
  if (!allowRegistration) {
    return new Response(JSON.stringify({
      error: 'Registration is not allowed'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Check Supabase configuration
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
    const { username, password } = await context.request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters long'
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
    
    // Check if username already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('username')
      .eq('username', username)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return new Response(JSON.stringify({
        error: 'Failed to check username availability'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (existingAdmin) {
      return new Response(JSON.stringify({
        error: 'Username already exists'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create new admin
    const { data: admin, error: insertError } = await supabase
      .from('admins')
      .insert([
        {
          username,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      return new Response(JSON.stringify({
        error: 'Failed to create admin account'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Generate a new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration
    
    // Get client IP and User Agent
    const ipAddress = context.request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = context.request.headers.get('user-agent') || '';
    
    // Store the token in the database
    const { error: tokenError } = await supabase
      .from('admin_tokens')
      .insert([
        {
          admin_id: admin.id,
          token,
          expires_at: expiresAt.toISOString(),
          user_agent: userAgent,
          ip_address: ipAddress
        }
      ]);
    
    if (tokenError) {
      return new Response(JSON.stringify({
        error: 'Failed to create token'
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
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
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