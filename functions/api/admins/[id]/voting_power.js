import { getSupabaseClient, withAuth } from '../../_shared/auth';
import { corsHeaders } from '../../_shared/cors';

async function handleUpdateVotingPower(context) {
  const { request, env, params, user } = context;

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(env);
    const { id } = params;
    const { voting_power } = await request.json();

    // Validate voting power
    if (typeof voting_power !== 'number' || voting_power < 1) {
      return new Response(
        JSON.stringify({ error: 'Voting power must be a positive number' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check if user is updating their own voting power
    if (id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only update your own voting power' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Update voting power
    const { data: admin, error } = await supabase
      .from('admins')
      .update({ voting_power })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(admin), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating voting power:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update voting power' }),
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

export const onRequestPut = withAuth(handleUpdateVotingPower); 