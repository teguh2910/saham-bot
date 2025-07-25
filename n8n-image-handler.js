// n8n Code Node: Handle Image Upload from Web Interface
// Place this node after your webhook trigger and before AI processing

// Get the input payload
const payload = $input.first().json.payload;

// Check if this is an image upload
if (payload.hasMedia && payload.media) {
  const mediaUrl = payload.media.url;
  const mimeType = payload.media.mimetype || 'image/jpeg';
  
  // Handle base64 data from web interface
  if (mediaUrl.startsWith('data:')) {
    console.log('Processing base64 image from web interface');
    
    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = mediaUrl.split(',')[1];
    
    // Create binary data for AI processing
    const binaryData = {
      data: base64Data,
      mimeType: mimeType,
      fileName: `uploaded_image_${Date.now()}.${mimeType.split('/')[1]}`,
      fileExtension: mimeType.split('/')[1]
    };
    
    return [{
      json: {
        imageSource: 'web_upload',
        hasValidImage: true,
        mimeType: mimeType,
        imageSize: Math.round(base64Data.length * 0.75), // Approximate size in bytes
        originalPayload: payload,
        processedAt: new Date().toISOString()
      },
      binary: {
        image: binaryData
      }
    }];
    
  } 
  // Handle URL from WhatsApp (your existing logic)
  else if (mediaUrl.startsWith('http')) {
    console.log('Processing image URL from WhatsApp');
    
    return [{
      json: {
        imageSource: 'whatsapp_url',
        imageUrl: mediaUrl,
        hasValidImage: true,
        mimeType: mimeType,
        originalPayload: payload,
        processedAt: new Date().toISOString()
      }
    }];
  }
  
  // Invalid media format
  else {
    console.log('Invalid media format received');
    
    return [{
      json: {
        imageSource: 'unknown',
        hasValidImage: false,
        error: 'Invalid media format',
        originalPayload: payload
      }
    }];
  }
}

// Not an image upload - pass through for text processing
else {
  console.log('No media detected, processing as text message');
  
  return [{
    json: {
      imageSource: 'none',
      hasValidImage: false,
      isTextMessage: true,
      messageBody: payload.body || payload._data?.body || '',
      originalPayload: payload
    }
  }];
}

/*
Usage in your workflow:

1. Place this code node after your webhook trigger
2. Connect the output to a Switch node with these conditions:
   - If hasValidImage = true AND imageSource = 'web_upload' → Process base64 image
   - If hasValidImage = true AND imageSource = 'whatsapp_url' → Download image from URL  
   - If hasValidImage = false → Process as text message

3. For base64 images, the binary data is ready for AI processing
4. For WhatsApp URLs, use your existing download logic

Example Switch Node Conditions:

Condition 1 (Web Image):
{{ $json.hasValidImage }} = true AND {{ $json.imageSource }} = 'web_upload'

Condition 2 (WhatsApp Image):  
{{ $json.hasValidImage }} = true AND {{ $json.imageSource }} = 'whatsapp_url'

Condition 3 (Text Message):
{{ $json.hasValidImage }} = false

*/
