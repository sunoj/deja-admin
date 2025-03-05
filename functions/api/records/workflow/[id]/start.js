// This file uses the Cloudflare Pages file-based routing to handle
// /api/sop/records/workflow/:id/start requests
// It redirects to the existing implementation in start-workflow.js

export async function onRequest(context) {
  console.log("Route handler: /api/sop/records/workflow/[id]/start.js called");
  console.log(`Request method: ${context.request.method}`);
  console.log(`URL: ${context.request.url}`);
  
  try {
    // Import the existing handler from start-workflow.js
    const { onRequest: startWorkflowHandler } = await import('../../../start-workflow.js');
    console.log("Successfully imported start-workflow.js handler");
    return startWorkflowHandler(context);
  } catch (error) {
    console.error(`Error importing start-workflow.js: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 