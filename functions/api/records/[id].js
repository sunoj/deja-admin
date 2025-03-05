// Cloudflare Worker function to handle SOP record details
import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
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
    const recordId = pathParts[pathParts.length - 1]; // Get the ID from /api/records/[id]

    // Get the record details
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

    // Get the workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('sop_workflows')
      .select('*')
      .eq('id', record.workflow_id)
      .single();

    if (workflowError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch workflow details', details: workflowError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get checklist items for this workflow
    const { data: checklistItems, error: checklistError } = await supabase
      .from('sop_checklist_items')
      .select('*')
      .eq('workflow_id', record.workflow_id)
      .order('order_number', { ascending: true });

    if (checklistError) {
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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses', details: responsesError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Return the combined data
    return new Response(
      JSON.stringify({
        record,
        workflow,
        checklistItems,
        responses
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 