import { createClient } from '@supabase/supabase-js';

async function verifyToken(token, supabase) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('admin_tokens')
      .select(`
        *,
        admin:admin_id (
          id,
          username
        )
      `)
      .eq('token', token)
      .single();
    
    if (tokenError || !tokenData) {
      throw new Error('Invalid token');
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired token
      await supabase
        .from('admin_tokens')
        .delete()
        .eq('id', tokenData.id);
      throw new Error('Token expired');
    }
    
    // Update last used time
    await supabase
      .from('admin_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
    
    return tokenData.admin;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

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
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No authentication token provided'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No authentication token provided'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const admin = await verifyToken(token, supabase);
    
    return new Response(JSON.stringify({
      success: true,
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
      success: false,
      error: 'Invalid authentication token'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 