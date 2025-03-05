// Cloudflare Worker function to handle SOP record completion
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables from context
export async function onRequestPost(context) {
  try {
    // Get environment variables from context
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
    const recordId = pathParts[pathParts.length - 2]; // Get the ID from /api/records/[id]/complete

    // Parse the request body
    const { notes } = await context.request.json();

    // Check if the record exists
    const { data: record, error: recordError } = await supabase
      .from('sop_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (recordError || !record) {
      return new Response(
        JSON.stringify({ error: 'Workflow record not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if the workflow is already completed
    if (record.status === 'completed') {
      return new Response(
        JSON.stringify({ error: 'Workflow is already completed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Log workflow_id to debug
    console.log('Fetching checklist items with workflow_id:', record.workflow_id);
    
    // Fetch all checklist items for this workflow
    // Note: We removed the .eq('required', true) filter as this column doesn't exist
    const { data: checklistItems, error: checklistError } = await supabase
      .from('sop_checklist_items')
      .select('*')
      .eq('workflow_id', record.workflow_id);

    if (checklistError) {
      console.error('Checklist error:', checklistError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch checklist items', details: checklistError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get responses for this record
    const { data: responses, error: responsesError } = await supabase
      .from('sop_checklist_responses')
      .select('*')
      .eq('record_id', recordId);

    if (responsesError) {
      console.error('Responses error:', responsesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses', details: responsesError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if all checklist items are completed
    const responsesMap = responses.reduce((map, response) => {
      map[response.checklist_item_id] = response;
      return map;
    }, {});

    // Consider an item required if it has requires_text or requires_image set to true,
    // or if we want all items to be completed regardless of requirements
    const incompleteItems = checklistItems.filter(item => {
      const response = responsesMap[item.id];
      // An item is incomplete if:
      // 1. There's no response
      // 2. It's not marked as completed
      // 3. It requires an image AND image is required but no image is uploaded
      return !response || 
             !response.completed || 
             (item.requires_image && item.image_required && !response.image_url);
    });

    if (incompleteItems.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot complete workflow - checklist items are incomplete',
          incompleteItems: incompleteItems.map(item => ({
            title: item.title,
            reason: !responsesMap[item.id] ? 'Not started' :
                    !responsesMap[item.id].completed ? 'Not completed' :
                    item.requires_image && item.image_required && !responsesMap[item.id].image_url ? 'Missing required image' :
                    'Incomplete'
          }))
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update the record as completed
    const completedAt = new Date().toISOString();
    const { data: updatedRecord, error: updateError } = await supabase
      .from('sop_records')
      .update({
        status: 'completed',
        completed_at: completedAt,
        notes: notes || null
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete workflow', details: updateError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        record: updatedRecord 
      }),
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