import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../../_shared/cors';
import { getUser } from '../../_shared/auth';

export async function onRequestGet({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
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

export async function onRequestPost({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getUser(request, env);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
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
    if (now < new Date(proposal.voting_start_date) || now > new Date(proposal.voting_end_date)) {
      return new Response(
        JSON.stringify({ error: 'Voting is not currently active for this proposal' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get user's voting power (implement your logic here)
    const votingPower = await calculateUserVotingPower(user.id);

    // Upsert vote
    const { data: vote, error: voteError } = await supabase
      .from('proposal_votes')
      .upsert({
        proposal_id: id,
        voter_id: user.id,
        support,
        voting_power: votingPower,
        reason
      })
      .select(`
        *,
        voter:auth.users!voter_id(id, email)
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

// Helper function to calculate user's voting power
async function calculateUserVotingPower(userId) {
  // Implement your voting power calculation logic here
  // This could be based on token holdings, reputation, etc.
  return 1; // Default voting power
} 