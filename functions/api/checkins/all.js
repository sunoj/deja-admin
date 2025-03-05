import { createClient } from '@supabase/supabase-js';
import { onRequest as authMiddleware } from '../../middleware/auth.js';

export async function onRequest(context, next) {
  // First check authentication
  const authResponse = await authMiddleware(context, next);
  if (authResponse.status !== 200) {
    return authResponse;
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = 'https://vncgcucejpmwpjcxdwhd.supabase.co';
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Join checkins with employees to get employee names
    const { data, error } = await supabase
      .from('checkins')
      .select(`
        *,
        employees:employee_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all check-in records:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch all check-in records', 
          details: error.message 
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify(data),
      { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
} 