import { getSupabaseClient, withAuth } from '../../_shared/auth';
import { corsHeaders } from '../../_shared/cors';

async function handleGetVotes(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;

    const { data: votes, error } = await supabase
      .from('proposal_votes')
      .select('support, voting_power')
      .eq('proposal_id', id);

    if (error) throw error;

    const results = {
      proposalId: id,
      totalVotes: votes.length,
      supportVotes: votes.filter(v => v.support).length,
      oppositionVotes: votes.filter(v => !v.support).length,
      totalVotingPower: votes.reduce((sum, v) => sum + v.voting_power, 0),
      supportVotingPower: votes.filter(v => v.support)
        .reduce((sum, v) => sum + v.voting_power, 0),
      oppositionVotingPower: votes.filter(v => !v.support)
        .reduce((sum, v) => sum + v.voting_power, 0)
    };

    return new Response(JSON.stringify(results), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching voting results:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch voting results' }),
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

async function handleCastVote(context) {
  const { request, env, params, user } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;
    const { support, reason } = await request.json();

    // Validate vote
    if (typeof support !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Vote support must be a boolean value' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check if proposal exists and is active
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select()
      .eq('id', id)
      .single();

    if (proposalError) {
      if (proposalError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Proposal not found' }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      throw proposalError;
    }

    const now = new Date();
    const votingStartDate = new Date(proposal.voting_start_date);
    const votingEndDate = new Date(proposal.voting_end_date);

    if (now < votingStartDate || now > votingEndDate) {
      return new Response(
        JSON.stringify({ 
          error: 'Voting is not currently active for this proposal',
          details: {
            now: now.toISOString(),
            startDate: votingStartDate.toISOString(),
            endDate: votingEndDate.toISOString()
          }
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get user's voting power from admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('voting_power')
      .eq('id', user.id)
      .single();

    if (adminError) throw adminError;

    // Upsert vote
    const { data: vote, error: voteError } = await supabase
      .from('proposal_votes')
      .upsert({
        proposal_id: id,
        voter_id: user.id,
        support,
        voting_power: admin.voting_power,
        reason
      })
      .select(`
        *,
        voter:admins!voter_id(id, username)
      `)
      .single();

    if (voteError) throw voteError;

    return new Response(JSON.stringify(vote), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to cast vote' }),
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

export const onRequestGet = handleGetVotes;
export const onRequestPost = withAuth(handleCastVote); 