// Cloudflare Worker function to handle workflows listing
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

    // Get all workflows from the database
    const { data: workflowsData, error } = await supabase
      .from('sop_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch workflows', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Map database fields to frontend expected fields if necessary
    // The frontend Workflow interface expects:
    // id, name, description, image_url, category_id, created_at, updated_at
    const workflows = (workflowsData || []).map(workflow => ({
      id: workflow.id,
      name: workflow.title || workflow.name,
      description: workflow.description,
      image_url: workflow.image_url,
      category_id: workflow.category_id,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at
    }));

    // Return the workflows as an array
    return new Response(
      JSON.stringify(workflows),
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