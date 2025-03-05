// Cloudflare Worker script for handling SOP images listing
export async function onRequest(context) {
  const { request, env } = context;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Check if we have the R2 bucket binding
    if (!env.MY_BUCKET) {
      return new Response(
        JSON.stringify({ error: 'Storage not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // List objects in the bucket (with pagination)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const cursor = url.searchParams.get('cursor') || undefined;
    
    // List objects from R2 bucket
    const listed = await env.MY_BUCKET.list({
      limit: limit,
      cursor: cursor,
    });
    
    // Format the response
    const response = {
      images: listed.objects.map(object => {
        return {
          name: object.key,
          url: `https://r2.nothingtodo.me/${object.key}`,
          size: object.size,
          uploaded: object.uploaded,
        };
      }),
      truncated: listed.truncated,
      cursor: listed.cursor,
    };
    
    return new Response(JSON.stringify(response), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error listing images:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list images' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 