import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';
import { getUser } from '../_shared/auth';

export async function onRequestGet({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
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

export async function onRequestPut({ request, env, params }) {
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