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
    const status = url.searchParams.get('status');

    // Build query
    let query = supabase
      .from('proposals')
      .select(`
        *,
        created_by_admin:admins!created_by(id, username)
      `)
      .order('created_at', { ascending: false });

    // Add status filter if provided, otherwise show active proposals
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'active');
    }

    // Get proposals with creator info
    const { data: proposals, error: proposalsError } = await query;

    if (proposalsError) throw proposalsError;

    // Get counts for each proposal
    if (proposals && proposals.length > 0) {
      const proposalIds = proposals.map(p => p.id);

      // Get counts for each proposal individually to maintain the relationship
      const [versionsData, commentsData, votesData] = await Promise.all([
        supabase.from('proposal_versions').select('proposal_id').in('proposal_id', proposalIds),
        supabase.from('proposal_comments').select('proposal_id').in('proposal_id', proposalIds),
        supabase.from('proposal_votes').select('proposal_id').in('proposal_id', proposalIds)
      ]);

      // Calculate counts for each proposal
      proposals.forEach(proposal => {
        proposal.versions_count = versionsData.data?.filter(v => v.proposal_id === proposal.id).length || 0;
        proposal.comments_count = commentsData.data?.filter(c => c.proposal_id === proposal.id).length || 0;
        proposal.votes_count = votesData.data?.filter(v => v.proposal_id === proposal.id).length || 0;
      });
    }

    return new Response(JSON.stringify(proposals), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch proposals',
        details: error.message
      }),
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