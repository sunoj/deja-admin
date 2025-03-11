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

    const url = new URL(context.request.url);
    const employeeId = url.searchParams.get('employee_id');

    switch (context.request.method) {
      case 'GET': {
        let query = supabase.from('schedule_rules').select('*');
        
        if (employeeId && employeeId !== 'all') {
          query = query.eq('employee_id', employeeId);
        }

        const { data: rules, error } = await query;

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ rules }), {
          headers: corsHeaders
        });
      }

      case 'POST': {
        const body = await context.request.json();
        const { employee_id, name, is_default, work_days, start_date, end_date } = body;

        if (!employee_id || !name || !work_days || !start_date) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // If this is a default rule, update any existing default rules for this employee
        if (is_default) {
          await supabase
            .from('schedule_rules')
            .update({ is_default: false })
            .eq('employee_id', employee_id)
            .eq('is_default', true);
        }

        const { data: rule, error } = await supabase
          .from('schedule_rules')
          .insert([{
            employee_id,
            name,
            is_default,
            work_days,
            start_date,
            end_date
          }])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify(rule), {
          headers: corsHeaders
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
} 