import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = (env) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
};

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

export const getUser = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const supabase = getSupabaseClient(env);
    const admin = await verifyToken(token, supabase);
    
    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error('Invalid token');
  }
};

export const handleAuth = async (request, env) => {
  try {
    return await getUser(request, env);
  } catch (error) {
    const errorMessage = error.message || 'Authentication failed';
    return {
      response: new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: errorMessage
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      ),
      user: null
    };
  }
};

export const withAuth = (handler) => {
  return async (context) => {
    const { request, env } = context;
    
    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Authenticate user
    const authResult = await handleAuth(request, env);
    if (authResult.response) {
      return authResult.response;
    }

    // Add authenticated admin to context
    context.user = authResult;
    
    // Call the original handler
    return handler(context);
  };
}; 