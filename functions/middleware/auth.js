import { createClient } from '@supabase/supabase-js';

async function verifyToken(token, supabase) {
  try {
    console.log('Verifying token:', token);
    
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
    
    console.log('Token query result:', { tokenData, tokenError });
    
    if (tokenError || !tokenData) {
      console.log('Token verification failed:', { tokenError, tokenData });
      throw new Error('Invalid token');
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    console.log('Token expiration check:', { 
      expiresAt: expiresAt.toISOString(),
      currentTime: new Date().toISOString(),
      isExpired: expiresAt < new Date()
    });
    
    if (expiresAt < new Date()) {
      console.log('Token is expired, deleting it');
      // Delete expired token
      await supabase
        .from('admin_tokens')
        .delete()
        .eq('id', tokenData.id);
      throw new Error('Token expired');
    }
    
    // Update last used time
    console.log('Updating token last used time');
    await supabase
      .from('admin_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
    
    console.log('Token verified successfully for admin:', tokenData.admin);
    return tokenData.admin;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}

export async function onRequest(context) {
  console.log('Auth middleware called for URL:', context.request.url);
  
  // Skip auth check for login endpoint
  if (context.request.url.includes('/api/auth/login')) {
    console.log('Skipping auth check for login endpoint');
    return true;
  }

  const supabaseUrl = context.env.SUPABASE_URL;
  const supabaseKey = context.env.SUPABASE_KEY;
  
  console.log('Supabase configuration:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
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
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid or missing Authorization header');
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
  console.log('Extracted token:', token);
  
  if (!token) {
    console.log('No token found in Authorization header');
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
    console.log('Admin authenticated successfully:', admin);
    
    return true;
  } catch (error) {
    console.error('Authentication failed:', error);
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