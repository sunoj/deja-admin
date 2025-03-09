import { getSupabaseClient, withAuth } from '../_shared/auth';
import { corsHeaders } from '../_shared/cors';

async function handleCreateProposal(context) {
  const { request, env, user } = context;

  try {
    const supabase = getSupabaseClient(env);
    const { title, content, votingStartDate, votingEndDate } = await request.json();

    // Validate required fields
    if (!title?.trim() || !content) {
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

    // Check if user exists in admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select()
      .eq('id', user.id)
      .single();

    console.log('Admin check:', { admin, adminError, userId: user.id });

    if (adminError) {
      console.error('Admin check error:', adminError);
      // If admin doesn't exist, create one
      const { data: newAdmin, error: createAdminError } = await supabase
        .from('admins')
        .insert({
          id: user.id,
          username: user.email || user.id,
          voting_power: 1
        })
        .select()
        .single();

      console.log('Admin creation:', { newAdmin, createAdminError });

      if (createAdminError) {
        console.error('Admin creation error:', createAdminError);
        throw createAdminError;
      }
    }

    // Set default voting period if not provided
    const now = new Date();
    const defaultStartDate = votingStartDate || now.toISOString();
    const defaultEndDate = votingEndDate || new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // Validate dates if provided
    if (votingStartDate && votingEndDate) {
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
    }

    // Create proposal
    const proposalData = {
      title,
      content,
      status: 'active',
      created_by: user.id,
      voting_start_date: defaultStartDate,
      voting_end_date: defaultEndDate,
      current_version: 1
    };

    console.log('Creating proposal with data:', proposalData);

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert(proposalData)
      .select()
      .single();

    if (proposalError) {
      console.error('Proposal creation error:', proposalError);
      throw proposalError;
    }

    console.log('Proposal created successfully:', proposal);

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

    if (versionError) {
      console.error('Version creation error:', versionError);
      throw versionError;
    }

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