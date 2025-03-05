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
    // 解析请求体
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
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 查询管理员
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    
    if (adminError || !admin) {
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
    
    // 验证密码
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
    
    // 更新最后登录时间
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
    
    // 返回成功响应
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