import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = (env) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
};

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
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
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
            'Content-Type': 'application/json'
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

    // Add authenticated user to context
    context.user = authResult;
    
    // Call the original handler
    return handler(context);
  };
}; 