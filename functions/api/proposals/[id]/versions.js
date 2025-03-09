import { getSupabaseClient } from '../../_shared/auth';
import { corsHeaders } from '../../_shared/cors';

async function handleGetVersions(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
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

export const onRequestGet = handleGetVersions; 