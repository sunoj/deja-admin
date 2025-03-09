import { getSupabaseClient, withAuth } from '../../_shared/auth';
import { corsHeaders } from '../../_shared/cors';

async function handleGetComments(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;

    const { data: comments, error } = await supabase
      .from('proposal_comments')
      .select(`
        *,
        author:admins!author_id(id, username)
      `)
      .eq('proposal_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(comments), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch comments' }),
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

async function handleAddComment(context) {
  const { request, env, params, user } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;
    const { content, parentId } = await request.json();

    // Validate content
    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Comment content is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { data: comment, error } = await supabase
      .from('proposal_comments')
      .insert({
        proposal_id: id,
        content,
        author_id: user.id,
        parent_id: parentId || null
      })
      .select(`
        *,
        author:admins!author_id(id, username)
      `)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add comment' }),
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

export const onRequestGet = handleGetComments;
export const onRequestPost = withAuth(handleAddComment); 