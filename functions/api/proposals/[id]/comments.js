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

    const { data: comments, error } = await supabase
      .from('proposal_comments')
      .select(`
        *,
        author:auth.users!author_id(id, email)
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
        author:auth.users!author_id(id, email)
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