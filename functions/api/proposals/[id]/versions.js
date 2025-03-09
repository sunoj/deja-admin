import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../../_shared/cors';

export async function onRequestGet({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { id } = params;

    const { data: versions, error } = await supabase
      .from('proposal_versions')
      .select(`
        *,
        created_by:auth.users!created_by(id, email)
      `)
      .eq('proposal_id', id)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(versions), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching proposal versions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch proposal versions' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 