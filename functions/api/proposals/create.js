import { getSupabaseClient, withAuth } from '../_shared/auth';
import { corsHeaders } from '../_shared/cors';

async function handleCreateProposal(context) {
  const { request, env, user } = context;

  try {
    const supabase = getSupabaseClient(env);
    const { title, content, votingStartDate, votingEndDate } = await request.json();

    // Validate required fields
    if (!title?.trim() || !content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!votingStartDate || !votingEndDate) {
      return new Response(
        JSON.stringify({ error: 'Voting start and end dates are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const startDate = new Date(votingStartDate);
    const endDate = new Date(votingEndDate);
    
    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({ error: 'Voting end date must be after start date' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Create proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        title,
        content,
        status: 'draft',
        created_by: user.id,
        voting_start_date: votingStartDate,
        voting_end_date: votingEndDate,
        current_version: 1
      })
      .select()
      .single();

    if (proposalError) throw proposalError;

    // Create initial version
    const { error: versionError } = await supabase
      .from('proposal_versions')
      .insert({
        proposal_id: proposal.id,
        version_number: 1,
        content: content,
        change_log: 'Initial version',
        created_by: user.id
      });

    if (versionError) throw versionError;

    return new Response(JSON.stringify(proposal), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create proposal' }),
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

export const onRequestPost = withAuth(handleCreateProposal); 