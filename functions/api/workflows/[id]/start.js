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

    // Extract the workflow ID from the URL
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const workflowId = pathParts[pathParts.length - 2]; // Get the ID from /api/workflows/[id]/start
    console.log(`Starting workflow with ID: ${workflowId}`);

    // Parse the request body
    const { employee_id } = await context.request.json();
    console.log(`Employee ID: ${employee_id}`);

    if (!employee_id) {
      console.error('Missing employee_id in request');
      return new Response(
        JSON.stringify({ error: 'Employee ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Get the workflow details
    console.log(`Fetching workflow details for ID: ${workflowId}`);
    const { data: workflow, error: workflowError } = await supabase
      .from('sop_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      console.error(`Error fetching workflow: ${JSON.stringify(workflowError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Workflow not found', 
          details: workflowError ? workflowError.message : 'No workflow data returned',
          code: workflowError ? workflowError.code : 'UNKNOWN'
        }),
        { status: 404, headers: corsHeaders }
      );
    }
    console.log(`Found workflow: ${workflow.name || workflow.title}`);

    // 2. Get checklist items for the workflow
    console.log(`Fetching checklist items for workflow ID: ${workflowId}`);
    const { data: checklistItems, error: checklistError } = await supabase
      .from('sop_checklist_items')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('order_number', { ascending: true });

    if (checklistError) {
      console.error(`Error fetching checklist items: ${JSON.stringify(checklistError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch checklist items', 
          details: checklistError.message,
          code: checklistError.code,
          hint: checklistError.hint || 'Check that sop_checklist_items table has the correct schema and permissions'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    console.log(`Found ${checklistItems ? checklistItems.length : 0} checklist items`);

    // 3. Create a new record
    console.log(`Creating workflow record for employee ${employee_id}`);
    const { data: record, error: recordError } = await supabase
      .from('sop_records')
      .insert({
        workflow_id: workflowId,
        workflow_name: workflow.name || workflow.title,
        employee_id,
        status: 'in_progress',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (recordError) {
      console.error(`Error creating workflow record: ${JSON.stringify(recordError)}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create workflow record', 
          details: recordError.message,
          code: recordError.code,
          hint: recordError.hint || 'Check that sop_records table has the correct schema and permissions'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    console.log(`Created workflow record with ID: ${record.id}`);

    // 4. Return the combined data
    console.log('Successfully started workflow, returning data');
    return new Response(
      JSON.stringify({
        workflow,
        checklistItems,
        record
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Unexpected error in workflow start: ${error.message}`, error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
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