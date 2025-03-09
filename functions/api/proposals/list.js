import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';

export async function onRequestGet({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';

    const { data: proposals, error } = await supabase
      .from('proposals')
      .select(`
        *,
        created_by:auth.users!created_by(id, email),
        versions:proposal_versions(count),
        comments:proposal_comments(count),
        votes:proposal_votes(count)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(proposals), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch proposals' }),
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