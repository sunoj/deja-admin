import { createClient } from '@supabase/supabase-js';

async function verifyToken(token, supabase) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('admin_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (tokenError || !tokenData) {
      throw new Error('Invalid token');
    }
    
    return tokenData;
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
    await verifyToken(token, supabase);
    
    // Delete the token
    await supabase
      .from('admin_tokens')
      .delete()
      .eq('token', token);
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
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