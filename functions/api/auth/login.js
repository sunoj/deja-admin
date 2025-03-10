import { createClient } from '@supabase/supabase-js';

// Web Crypto API for password hashing
async function comparePasswords(password, hash) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Hash the input password
  const passwordHash = await crypto.subtle.digest('SHA-256', passwordData);
  
  // Convert the hash to hex string
  const passwordHashHex = Array.from(new Uint8Array(passwordHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Compare the hex strings
  return passwordHashHex === hash;
}

// Generate a random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  // 从环境变量获取 Supabase 配置
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  // 如果没有配置 Supabase，返回错误
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
  
  // 处理 OPTIONS 请求（CORS 预检）
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // 只允许 POST 请求
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
        error: 'Username/Email and password are required'
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
    
    // Check if username is email
    const isEmail = username.includes('@');
    
    // Find admin by username or email
    const { data: admin, error: findError } = await supabase
      .from('admins')
      .select('*')
      .or(isEmail ? `email.eq.${username}` : `username.eq.${username.toLowerCase()}`)
      .single();
    
    if (findError || !admin) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Validate password
    const validPassword = await comparePasswords(password, admin.password_hash);
    
    if (!validPassword) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Update last login time
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);
    
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