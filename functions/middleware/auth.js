import { createClient } from '@supabase/supabase-js';

async function verifyToken(token, supabase) {
  try {
    // Get token from database
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

export async function onRequest(context, next) {
  // Skip auth check for login endpoint
  if (context.request.url.includes('/api/auth/login')) {
    return next();
  }

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
    
    // Verify token
    const admin = await verifyToken(token, supabase);
    
    // Add admin ID to request context
    context.adminId = admin.id;
    
    // Continue to next middleware/route handler
    return next();
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