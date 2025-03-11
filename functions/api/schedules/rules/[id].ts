import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../../../middleware/auth';

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

    // Extract and validate the rule ID
    const url = new URL(context.request.url);
    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
    const ruleId = pathSegments[pathSegments.length - 1];

    console.log('Request URL:', url.toString());
    console.log('Rule ID:', ruleId);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!ruleId || !uuidRegex.test(ruleId)) {
      console.log('Invalid UUID format for rule ID:', ruleId);
      return new Response(JSON.stringify({ error: 'Invalid rule ID format' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    switch (context.request.method) {
      case 'PUT': {
        const body = await context.request.json();
        console.log('Received PUT request body:', JSON.stringify(body, null, 2));

        const { employee_id, name, is_default, work_days, start_date, end_date } = body;

        // Log all required fields
        const requiredFields = {
          employee_id,
          name,
          work_days,
          start_date
        };

        console.log('Required fields check:', {
          employee_id: !!employee_id,
          name: !!name,
          work_days: !!work_days,
          start_date: !!start_date
        });

        // Validate required fields
        const missingFields = Object.entries(requiredFields)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        if (missingFields.length > 0) {
          console.log('Missing required fields:', missingFields);
          return new Response(JSON.stringify({ 
            error: 'Missing required fields',
            missingFields: missingFields
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // If this is a default rule, update any existing default rules for this employee
        if (is_default) {
          console.log('Updating existing default rules for employee:', employee_id);
          await supabase
            .from('schedule_rules')
            .update({ is_default: false })
            .eq('employee_id', employee_id)
            .eq('is_default', true)
            .neq('id', ruleId);
        }

        const updateData = {
          employee_id,
          name,
          is_default,
          work_days,
          start_date,
          end_date,
          updated_at: new Date().toISOString()
        };
        console.log('Updating rule with data:', JSON.stringify(updateData, null, 2));

        const { data: rule, error } = await supabase
          .from('schedule_rules')
          .update(updateData)
          .eq('id', ruleId)
          .select()
          .single();

        if (error) {
          console.log('Supabase update error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }

        console.log('Successfully updated rule:', JSON.stringify(rule, null, 2));
        return new Response(JSON.stringify(rule), {
          headers: corsHeaders
        });
      }

      case 'DELETE': {
        console.log('Attempting to delete rule:', ruleId);
        const { error } = await supabase
          .from('schedule_rules')
          .delete()
          .eq('id', ruleId);

        if (error) {
          console.log('Supabase delete error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }

        console.log('Successfully deleted rule:', ruleId);
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }

      default:
        console.log('Method not allowed:', context.request.method);
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders
        });
    }
  } catch (error) {
    console.log('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
} 