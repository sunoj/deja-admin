// Cloudflare Worker function to handle SOP workflow checklist
import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const workflowId = params.id;
  
  console.log(`Handling workflow checklist request for workflow ${workflowId}, method: ${method}`);
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Common response headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  
  // Only allow GET requests
  if (method !== 'GET') {
    console.warn(`Received unsupported method: ${method} for workflow ${workflowId}`);
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      allowedMethods: ['GET']
    }), {
      status: 405,
      headers: {
        ...headers,
        'Allow': 'GET, OPTIONS'
      }
    });
  }
  
  // Initialize Supabase client
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. SUPABASE_URL or SUPABASE_KEY not set in environment');
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing',
      details: 'Environment variables SUPABASE_URL or SUPABASE_KEY are not configured'
    }), {
      status: 500,
      headers
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log(`Checking if workflow ${workflowId} exists`);
    // Check if the workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('sop_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();
    
    if (workflowError || !workflow) {
      console.error(`Workflow not found: ${workflowId}, error: ${JSON.stringify(workflowError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Workflow not found',
          details: workflowError ? workflowError.message : 'No workflow found with this ID',
          code: workflowError ? workflowError.code : 'UNKNOWN',
          workflowId
        }),
        { status: 404, headers }
      );
    }
    
    console.log(`Fetching checklist items for workflow ${workflowId} (${workflow.name || workflow.title})`);
    // Get checklist items for this workflow
    const { data: checklistItems, error: checklistError } = await supabase
      .from('sop_checklist_items')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('order_number');
    
    if (checklistError) {
      console.error(`Error fetching checklist items: ${JSON.stringify(checklistError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch checklist items', 
          details: checklistError.message,
          code: checklistError.code,
          hint: checklistError.hint || 'Check that sop_checklist_items table exists and has correct schema',
          workflowId,
          query: { table: 'sop_checklist_items', workflow_id: workflowId }
        }),
        { status: 500, headers }
      );
    }
    
    console.log(`Successfully retrieved ${checklistItems ? checklistItems.length : 0} checklist items`);
    return new Response(
      JSON.stringify(checklistItems || []),
      { status: 200, headers }
    );
  } catch (error) {
    console.error(`Unexpected error in checklist endpoint: ${error.message}`, error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        workflowId
      }),
      { status: 500, headers }
    );
  }
} 