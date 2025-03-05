// Cloudflare Worker script for serving SOP images from R2
export async function onRequest(context) {
  const { request, env, params } = context;
  
  // 添加详细日志
  console.log('Image request received:', {
    url: request.url,
    method: request.method,
    imageId: params.id,
    headers: Object.fromEntries([...request.headers])
  });
  
  try {
    // 检查是否有R2桶绑定
    if (!env.MY_BUCKET) {
      console.error('R2 bucket not configured for image retrieval');
      return new Response(
        JSON.stringify({ error: 'Storage not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 从URL参数中提取文件名
    const filename = params.id;
    
    if (!filename) {
      console.error('Image ID not specified in request');
      return new Response('Image ID not specified', { status: 404 });
    }
    
    console.log(`Retrieving image: ${filename}`);
    
    // 从R2获取对象
    const object = await env.MY_BUCKET.get(filename);
    
    if (object === null) {
      console.error(`Image not found in R2: ${filename}`);
      return new Response(
        JSON.stringify({ error: 'Image not found', id: filename }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    // 获取内容类型
    const contentType = object.httpMetadata?.contentType || 
                       (filename.endsWith('.png') ? 'image/png' : 
                        filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 
                        'application/octet-stream');
    
    console.log(`Image found, content type: ${contentType}, size: ${object.size}`);
    
    // 准备响应头
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存1年
    headers.set('Access-Control-Allow-Origin', '*'); // 允许CORS
    headers.set('Content-Type', contentType); // 确保设置了正确的内容类型
    
    // 返回图片内容
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to serve image', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
} 