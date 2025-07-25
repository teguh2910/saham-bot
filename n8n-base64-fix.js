// n8n Code Node: Fix Base64 Image Processing
// This handles the truncation issue with base64 data

const inputData = $input.first().json;

// Get the payload
const payload = inputData.payload || inputData;

console.log('=== DEBUGGING BASE64 ISSUE ===');
console.log('Input keys:', Object.keys(inputData));
console.log('Payload keys:', Object.keys(payload));
console.log('Has media:', payload.hasMedia);

if (payload.hasMedia && payload.media && payload.media.url) {
  const fullDataUrl = payload.media.url;
  const mimeType = payload.media.mimetype || 'image/png';
  
  console.log('Full data URL length:', fullDataUrl.length);
  console.log('MIME type:', mimeType);
  console.log('Data URL starts with:', fullDataUrl.substring(0, 50));
  
  // Check if it's a proper data URL
  if (fullDataUrl.startsWith('data:image/')) {
    try {
      // Find the comma that separates header from data
      const commaIndex = fullDataUrl.indexOf(',');
      
      if (commaIndex === -1) {
        throw new Error('No comma found in data URL');
      }
      
      // Extract the base64 part (everything after the comma)
      const base64String = fullDataUrl.substring(commaIndex + 1);
      
      console.log('Comma found at index:', commaIndex);
      console.log('Base64 string length:', base64String.length);
      console.log('Base64 starts with:', base64String.substring(0, 20));
      console.log('Base64 ends with:', base64String.substring(base64String.length - 20));
      
      // Validate base64 format
      if (base64String.length === 0) {
        throw new Error('Empty base64 string');
      }
      
      // Check if it looks like valid base64
      if (!base64String.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error('Invalid base64 characters detected');
      }
      
      // Determine file extension
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = `web_image_${Date.now()}.${extension}`;
      
      // Return the data in multiple formats for testing
      return [{
        json: {
          // Status info
          success: true,
          imageSource: 'web_base64',
          processedAt: new Date().toISOString(),
          
          // Image info
          mimeType: mimeType,
          fileName: fileName,
          extension: extension,
          
          // Size info
          originalUrlLength: fullDataUrl.length,
          base64Length: base64String.length,
          estimatedSizeKB: Math.round(base64String.length * 0.75 / 1024),
          
          // Data for different processing methods
          base64Data: base64String,
          dataUrl: fullDataUrl,
          
          // For debugging
          base64Preview: base64String.substring(0, 50) + '...',
          
          // Original payload for reference
          originalPayload: payload
        },
        
        // Try to create binary data
        binary: {
          image: {
            data: base64String,
            mimeType: mimeType,
            fileName: fileName
          }
        }
      }];
      
    } catch (error) {
      console.error('Error processing base64:', error.message);
      
      return [{
        json: {
          success: false,
          error: error.message,
          imageSource: 'web_base64_failed',
          
          // Debug info
          fullDataUrl: fullDataUrl.substring(0, 100) + '...',
          dataUrlLength: fullDataUrl.length,
          mimeType: mimeType,
          
          originalPayload: payload
        }
      }];
    }
  } else {
    // Not a data URL - might be a regular URL
    console.log('Not a data URL, treating as regular URL');
    
    return [{
      json: {
        success: true,
        imageSource: 'url',
        imageUrl: fullDataUrl,
        mimeType: mimeType,
        originalPayload: payload
      }
    }];
  }
} else {
  // No image data
  console.log('No image data found');
  
  return [{
    json: {
      success: true,
      imageSource: 'none',
      hasImage: false,
      messageText: payload.body || payload._data?.body || '',
      originalPayload: payload
    }
  }];
}

/*
USAGE INSTRUCTIONS:

1. Place this node right after your Webhook trigger
2. Check the execution log to see the debug output
3. Look for these key values:
   - base64Length: Should be a large number (thousands)
   - base64Preview: Should start with something like "iVBORw0KGgoAAAANSUhEUgAA..."
   - success: Should be true

4. If base64Length is very small or base64Preview looks wrong:
   - The issue is in how the frontend is sending the data
   - Check the browser console for errors

5. Connect the output to your next processing node
6. Use {{ $json.base64Data }} for the base64 string
7. Use {{ $json.mimeType }} for the MIME type

TROUBLESHOOTING:
- If base64Length is 0: The data URL format is wrong
- If success is false: Check the error message
- If binary data is empty: Try using $json.base64Data directly in your AI node
*/
