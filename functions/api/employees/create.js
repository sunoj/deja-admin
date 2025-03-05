import { createClient } from '@supabase/supabase-js';

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
    const { name } = await context.request.json();
    
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
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 生成 6 位恢复码
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 获取客户端 IP 地址
    const ipAddress = getClientIp(context.request);
    
    // 获取 User Agent
    const userAgent = context.request.headers.get('user-agent') || '';
    
    // 创建员工记录
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        { 
          name, 
          recovery_code: recoveryCode,
          user_agent: userAgent,
          ip_address: ipAddress
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
    
    // 返回成功响应
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