// n8n Code Node: Convert Base64 to Binary (Fixed Version)
// This handles the "data:image/png;base64,..." format correctly

const payload = $input.first().json.payload;

if (payload.hasMedia && payload.media && payload.media.url) {
  const mediaUrl = payload.media.url;
  const mimeType = payload.media.mimetype || 'image/jpeg';
  
  // Handle base64 data from web interface
  if (mediaUrl.startsWith('data:')) {
    try {
      console.log('Processing base64 image from web interface');
      console.log('Original URL length:', mediaUrl.length);
      console.log('MIME type:', mimeType);
      
      // Extract base64 data - remove the data URL prefix
      // Format: "data:image/png;base64,iVBORw0..." -> "iVBORw0..."
      const base64Data = mediaUrl.split(',')[1];
      
      if (!base64Data) {
        throw new Error('No base64 data found after comma');
      }
      
      console.log('Extracted base64 length:', base64Data.length);
      
      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Data)) {
        throw new Error('Invalid base64 format');
      }
      
      // Determine file extension from MIME type
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `web_upload_${Date.now()}.${fileExtension}`;
      
      // Create proper binary data structure for n8n
      const binaryData = {
        data: base64Data,
        mimeType: mimeType,
        fileName: fileName,
        fileExtension: fileExtension
      };
      
      console.log('Created binary data:', {
        fileName: binaryData.fileName,
        mimeType: binaryData.mimeType,
        dataLength: binaryData.data.length
      });
      
      return [{
        json: {
          success: true,
          imageSource: 'web_upload',
          hasValidImage: true,
          mimeType: mimeType,
          fileName: fileName,
          imageSize: Math.round(base64Data.length * 0.75), // Approximate size in bytes
          originalPayload: payload,
          processedAt: new Date().toISOString()
        },
        binary: {
          data: binaryData
        }
      }];
      
    } catch (error) {
      console.error('Error processing base64 image:', error.message);
      
      return [{
        json: {
          success: false,
          error: `Failed to process image: ${error.message}`,
          imageSource: 'web_upload_failed',
          hasValidImage: false,
          originalPayload: payload
        }
      }];
    }
  }
  
  // Handle URL from WhatsApp (existing logic)
  else if (mediaUrl.startsWith('http')) {
    console.log('Processing image URL from WhatsApp');
    
    return [{
      json: {
        success: true,
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
    console.log('Invalid media format:', mediaUrl.substring(0, 50) + '...');
    
    return [{
      json: {
        success: false,
        error: 'Invalid media format - not base64 or URL',
        imageSource: 'unknown',
        hasValidImage: false,
        originalPayload: payload
      }
    }];
  }
}

// Not an image upload
else {
  return [{
    json: {
      success: true,
      imageSource: 'none',
      hasValidImage: false,
      isTextMessage: true,
      messageBody: payload.body || payload._data?.body || '',
      originalPayload: payload
    }
  }];
}

/*
TROUBLESHOOTING TIPS:

1. Check the console logs in n8n execution to see:
   - Original URL length
   - Extracted base64 length  
   - Any error messages

2. If still getting "value not set" error:
   - The binary data might not be reaching the next node
   - Check the connection between nodes
   - Verify the next node expects binary input

3. Alternative approach - Save to temp file:
   - Use "Write Binary File" node to save the image
   - Then read it back for AI processing

4. For AI processing, make sure:
   - The AI node is configured to accept binary input
   - The binary property name matches (usually "data")
   - The MIME type is supported by your AI model

USAGE:
1. Place this node after webhook trigger
2. Connect to Switch node with condition: {{ $json.success }} = true
3. For successful web uploads, connect to your AI image processing
4. For errors, connect to error handling/response
*/
