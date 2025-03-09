import { getSupabaseClient, withAuth } from '../_shared/auth';
import { corsHeaders } from '../_shared/cors';

async function handleGetProposal(context) {
  const { request, env, params } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        created_by:auth.users!created_by(id, email),
        versions:proposal_versions(count),
        comments:proposal_comments(count),
        votes:proposal_votes(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
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
      throw error;
    }

    return new Response(JSON.stringify(proposal), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch proposal' }),
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

async function handleUpdateProposal(context) {
  const { request, env, params, user } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;
    const { title, content, status, votingStartDate, votingEndDate, changeLog } = await request.json();

    // Check if proposal exists and user is the creator
    const { data: existingProposal, error: fetchError } = await supabase
      .from('proposals')
      .select()
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
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
      throw fetchError;
    }

    if (existingProposal.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the creator can update the proposal' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const updates = {
      ...(title && { title }),
      ...(content && { content }),
      ...(status && { status }),
      ...(votingStartDate && { voting_start_date: votingStartDate }),
      ...(votingEndDate && { voting_end_date: votingEndDate }),
      current_version: existingProposal.current_version + (content ? 1 : 0)
    };

    // Update proposal
    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create new version if content changed
    if (content && content !== existingProposal.content) {
      const { error: versionError } = await supabase
        .from('proposal_versions')
        .insert({
          proposal_id: id,
          version_number: updatedProposal.current_version,
          content: content,
          change_log: changeLog || 'Content updated',
          created_by: user.id
        });

      if (versionError) throw versionError;
    }

    return new Response(JSON.stringify(updatedProposal), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update proposal' }),
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

export const onRequestGet = handleGetProposal;
export const onRequestPut = withAuth(handleUpdateProposal); 