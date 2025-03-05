// Cloudflare Worker script for handling SOP image uploads to R2
export async function onRequest(context) {
  const { request, env } = context;
  
  // Add detailed debugging
  console.log('Image upload request received');
  console.log('Environment check:', {
    hasR2Bucket: !!env.MY_BUCKET,
    method: request.method,
    url: request.url
  });
  
  try {
    // Check if we have the R2 bucket binding
    if (!env.MY_BUCKET) {
      console.error('R2 bucket not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Storage not configured',
          detail: 'R2 bucket binding is not available'
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
    
    // Parse the multipart form data
    let imageFile;
    try {
      const formData = await request.formData();
      imageFile = formData.get('image');
      console.log('Form data parsed successfully, image file present:', !!imageFile);
      if (imageFile) {
        console.log('Image file details:', {
          type: imageFile.type,
          size: imageFile.size,
          name: imageFile.name
        });
      }
    } catch (formError) {
      console.error('Error parsing form data:', formError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse form data',
          details: formError.message
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    if (!imageFile) {
      console.error('No image file provided in request');
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    // Validate file type
    const contentType = imageFile.type;
    if (!contentType.startsWith('image/')) {
      console.error('Invalid file type:', contentType);
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only images are allowed.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = contentType.split('/')[1];
    const filename = `sop_image_${timestamp}_${randomString}.${fileExtension}`;
    
    console.log(`Uploading image to R2 with filename: ${filename}`);
    
    // Upload to R2
    try {
      await env.MY_BUCKET.put(filename, imageFile.stream(), {
        httpMetadata: {
          contentType: contentType,
        }
      });
      console.log('R2 upload successful');
    } catch (uploadError) {
      console.error('Error uploading to R2:', uploadError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload to storage',
          details: uploadError.message
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
    
    // Generate the public URL for the image using R2 direct domain
    const imageUrl = `https://r2.nothingtodo.me/${filename}`;
    
    console.log(`Image uploaded successfully: ${filename}`);
    console.log(`Image URL: ${imageUrl}`);
    
    // Build response object
    const responseObject = { 
      url: imageUrl,
      filename: filename,
      success: true 
    };
    
    console.log('Sending success response:', responseObject);
    
    return new Response(
      JSON.stringify(responseObject),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upload image', 
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