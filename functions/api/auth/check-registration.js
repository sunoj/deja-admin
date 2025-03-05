export async function onRequest(context) {
  // Get registration status from environment variable
  const allowRegistration = context.env.ALLOW_REGISTRATION === 'true';
  
  // Debug logging
  console.log('Environment variables:', {
    ALLOW_REGISTRATION: context.env.ALLOW_REGISTRATION,
    allowRegistration
  });
  
  // Handle OPTIONS request (CORS preflight)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Only allow GET requests
  if (context.request.method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  return new Response(JSON.stringify({
    allowRegistration,
    debug: {
      envValue: context.env.ALLOW_REGISTRATION,
      parsedValue: allowRegistration
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
} 