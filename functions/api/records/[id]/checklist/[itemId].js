// Cloudflare Worker function to handle SOP checklist item updates
import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method;
  
  // Log the invocation and params
  console.log(`Handling checklist item request for record ${params.id} and item ${params.itemId}`);
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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
  
  // Initialize Supabase client
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({
      error: 'Supabase configuration is missing'
    }), {
      status: 500,
      headers
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (method !== 'PATCH') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      allowedMethods: ['PATCH']
    }), {
      status: 405,
      headers: {
        ...headers,
        'Allow': 'PATCH, OPTIONS'
      }
    });
  }
  
  const recordId = params.id;
  const checklistItemId = params.itemId;
  
  try {
    const requestData = await request.json();
    
    // Check if record exists
    const { data: record, error: recordError } = await supabase
      .from('sop_records')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (recordError || !record) {
      return new Response(
        JSON.stringify({ error: 'Record not found' }),
        { status: 404, headers }
      );
    }
    
    // Check if checklist item exists
    const { data: checklistItem, error: checklistError } = await supabase
      .from('sop_checklist_items')
      .select('*')
      .eq('id', checklistItemId)
      .single();
    
    if (checklistError || !checklistItem) {
      return new Response(
        JSON.stringify({ error: 'Checklist item not found' }),
        { status: 404, headers }
      );
    }
    
    // Check if response already exists
    const { data: existingResponse, error: responseError } = await supabase
      .from('sop_checklist_responses')
      .select('*')
      .eq('record_id', recordId)
      .eq('checklist_item_id', checklistItemId)
      .single();
    
    let responseData;
    
    if (existingResponse) {
      // Update existing response
      const { data, error } = await supabase
        .from('sop_checklist_responses')
        .update({
          ...requestData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)
        .select()
        .single();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update response', details: error.message }),
          { status: 500, headers }
        );
      }
      
      responseData = data;
    } else {
      // Create new response
      const { data, error } = await supabase
        .from('sop_checklist_responses')
        .insert([
          {
            record_id: recordId,
            checklist_item_id: checklistItemId,
            ...requestData,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create response', details: error.message }),
          { status: 500, headers }
        );
      }
      
      responseData = data;
    }
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
} 