import { getSupabaseClient, withAuth } from '../_shared/auth';
import { corsHeaders } from '../_shared/cors';

async function handleListProposals(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';

    const { data: proposals, error } = await supabase
      .from('proposals')
      .select(`
        *,
        created_by:auth.users!created_by(id, email),
        versions:proposal_versions!proposal_id(count(*)),
        comments:proposal_comments!proposal_id(count(*)),
        votes:proposal_votes!proposal_id(count(*))
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

export const onRequestGet = withAuth(handleListProposals); 