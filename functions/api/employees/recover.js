import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
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
  
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
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
    const { recoveryCode } = await context.request.json();
    
    if (!recoveryCode || recoveryCode.length !== 6) {
      return new Response(JSON.stringify({
        error: 'Valid recovery code is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('recovery_code', recoveryCode)
      .single();
    
    if (error || !data) {
      return new Response(JSON.stringify({
        error: 'Invalid recovery code'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 获取客户端 IP 地址
    const ipAddress = getClientIp(context.request);
    
    // 获取 User Agent
    const userAgent = context.request.headers.get('user-agent') || '';
    
    // 更新用户的 IP 地址和 User Agent
    await supabase
      .from('employees')
      .update({ 
        user_agent: userAgent,
        ip_address: ipAddress
      })
      .eq('id', data.id);
    
    return new Response(JSON.stringify({
      id: data.id,
      name: data.name
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

// 获取客户端 IP 地址
function getClientIp(request) {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 获取列表中的第一个 IP（客户端原始 IP）
    return forwardedFor.split(',')[0].trim();
  }
  
  return '127.0.0.1';
} 