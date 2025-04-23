/**
 * Endpoint to retrieve all leave types
 * 
 * Table Structure:
 * leave_types:
 *   - id: uuid (primary key)
 *   - name: string
 * 
 * Response Structure:
 * Success (200):
 * {
 *   "leave_types": [
 *     {
 *       "id": "uuid",
 *       "name": "string"
 *     }
 *   ]
 * }
 * 
 * Error Responses:
 * - 405: Method not allowed
 * - 500: Server error (Supabase config missing, fetch failed)
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../../middleware/auth';

export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (context.request.method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin token
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      await verifyAdminToken(token, supabase);
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Fetch all leave types
    const { data: leaveTypes, error: fetchError } = await supabase
      .from('leave_types')
      .select('id, name')
      .order('name');

    if (fetchError) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch leave types',
        details: fetchError.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ leave_types: leaveTypes }), {
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch leave types',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
} 