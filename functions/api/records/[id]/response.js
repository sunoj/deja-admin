import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    // Initialize Supabase client with environment variables from context
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Extract the record ID from the URL
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const recordId = pathParts[pathParts.length - 2]; // Get the ID from /api/records/[id]/response

    // Parse the request body
    const { checklist_item_id, completed, value, image_url } = await context.request.json();

    if (!checklist_item_id) {
      return new Response(
        JSON.stringify({ error: 'Checklist item ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if the record exists
    const { data: record, error: recordError } = await supabase
      .from('sop_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (recordError || !record) {
      return new Response(
        JSON.stringify({ error: 'Record not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the workflow is still in progress
    if (record.status !== 'in_progress') {
      return new Response(
        JSON.stringify({ error: 'Cannot update responses for a completed workflow' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if a response already exists for this item
    const { data: existingResponse, error: checkError } = await supabase
      .from('sop_checklist_responses')
      .select('*')
      .eq('record_id', recordId)
      .eq('checklist_item_id', checklist_item_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows found" error
      return new Response(
        JSON.stringify({ error: 'Error checking existing response', details: checkError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    let response;
    const now = new Date().toISOString();

    if (existingResponse) {
      // Update existing response
      const { data, error: updateError } = await supabase
        .from('sop_checklist_responses')
        .update({
          completed: completed !== undefined ? completed : existingResponse.completed,
          value: value !== undefined ? value : existingResponse.value,
          image_url: image_url !== undefined ? image_url : existingResponse.image_url,
          updated_at: now
        })
        .eq('id', existingResponse.id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update response', details: updateError.message }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      response = data;

      // Update completed_items count if completion status changed
      if (completed !== undefined && completed !== existingResponse.completed) {
        const { error: countError } = await supabase.rpc('update_completed_items_count', {
          record_id: recordId,
          increment: completed ? 1 : -1
        });

        if (countError) {
          console.error('Error updating completed items count:', countError);
        }
      }
    } else {
      // Create new response
      const { data, error: insertError } = await supabase
        .from('sop_checklist_responses')
        .insert([
          {
            record_id: recordId,
            checklist_item_id,
            completed: completed !== undefined ? completed : false,
            value,
            image_url,
            created_at: now,
            updated_at: now
          }
        ])
        .select()
        .single();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to save checklist response', details: insertError.message }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      response = data;

      // Update completed_items count for new response
      if (completed) {
        const { error: countError } = await supabase.rpc('update_completed_items_count', {
          record_id: recordId,
          increment: 1
        });

        if (countError) {
          console.error('Error updating completed items count:', countError);
        }
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 