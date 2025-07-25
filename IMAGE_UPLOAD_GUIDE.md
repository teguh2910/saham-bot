# How to Handle User Image Uploads in n8n

This guide explains how the web chatbot handles image uploads and how your n8n workflow should process them.

## Image Upload Flow

```
User clicks 📎 → Selects image → Frontend converts to base64 → Sends to n8n → n8n processes → Returns response
```

## What Happens When User Sends a Picture

### 1. Frontend Processing
- User clicks the attachment button (📎) or drags an image
- Image is displayed in the chat as a user message
- Image is converted to base64 format
- Special payload is sent to n8n with `hasMedia: true`

### 2. Payload Structure for Images

When a user uploads an image, n8n receives this payload:

```json
{
  "session": "web-session-001",
  "payload": {
    "id": "web_img_1234567890",
    "from": "6281234567890@c.us",
    "body": "",
    "_data": {
      "body": "",
      "from": "6281234567890@c.us",
      "quotedParticipant": null,
      "mentionedJidList": []
    },
    "hasMedia": true,
    "media": {
      "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
      "mimetype": "image/jpeg"
    },
    "timestamp": 1234567890
  }
}
```

### Key Differences from Text Messages:
- `hasMedia: true` (instead of false)
- `body: ""` (empty text)
- `media` object contains base64 data and mimetype

## How Your n8n Workflow Should Handle Images

Looking at your current workflow, you already have image processing logic! Let me show you how to adapt it for the web interface.

### Current Image Processing in Your Workflow

Your workflow has these image-related nodes:
1. **"get type" Switch** - Detects if message has media
2. **"Information Extractor"** - Extracts URL from media
3. **"download img"** - Downloads the image
4. **"AI Agent Img , Text"** - Processes image with AI

### Modifications Needed for Web Interface

#### 1. Update the "get type" Switch Node

Your current condition checks `payload.hasMedia` for boolean true. This should work with the web interface since we send `hasMedia: true`.

**Current condition (should work):**
```
{{ $json.payload.hasMedia }} equals true
```

#### 2. Handle Base64 Data Instead of URL

The web interface sends base64 data directly, not a URL. You need to modify the image processing:

**Option A: Use Base64 Directly**
Add a new node after "get type" switch:

```javascript
// Node: "Process Base64 Image"
// Type: Code
const payload = $input.first().json.payload;

if (payload.hasMedia && payload.media.url.startsWith('data:')) {
  // Extract base64 data
  const base64Data = payload.media.url.split(',')[1];
  const mimeType = payload.media.mimetype;
  
  return [{
    json: {
      imageData: base64Data,
      mimeType: mimeType,
      hasValidImage: true
    },
    binary: {
      data: {
        data: base64Data,
        mimeType: mimeType
      }
    }
  }];
} else {
  return [{ json: { hasValidImage: false } }];
}
```

**Option B: Convert Base64 to Temporary URL**
Use the "HTTP Request" node to convert base64 to a temporary URL service.

#### 3. Update AI Agent for Image Analysis

Your "AI Agent Img , Text" node should receive the image data. Make sure it's configured to:
- Accept binary image data
- Process images with the AI model
- Return text analysis of the image

#### 4. Add Webhook Response for Image Analysis

Add a "Respond to Webhook" node after image processing:

```json
{
  "message": "{{ $('AI Agent Img , Text').item.json.output }}",
  "type": "image_analysis",
  "originalImage": "{{ $json.payload.media.url }}",
  "analysis": "{{ $('AI Agent Img , Text').item.json.output }}"
}
```

## Complete Image Processing Flow

### Updated Workflow Path:

```
Webhook Trigger 
→ Switch (detect hasMedia: true)
→ Process Base64 Image 
→ AI Agent Img , Text 
→ Respond to Webhook
```

### Example Response for Image Analysis:

```json
{
  "message": "I can see this is a stock chart showing BBCA's price movement. The chart indicates a bullish trend with strong support at 8,200 level. The volume is increasing which confirms the upward momentum. Consider buying on any dips to the support level.",
  "type": "image_analysis"
}
```

## Implementation Steps

### Step 1: Test Current Image Detection

1. Upload an image using the web interface
2. Check if your "get type" switch correctly identifies `hasMedia: true`
3. Look at the n8n execution log to see the payload structure

### Step 2: Handle Base64 Data

Add this code node after your switch:

```javascript
// Handle Web Interface Images
const payload = $input.first().json.payload;

if (payload.hasMedia && payload.media && payload.media.url) {
  const mediaUrl = payload.media.url;
  
  if (mediaUrl.startsWith('data:')) {
    // Base64 from web interface
    const [header, base64Data] = mediaUrl.split(',');
    const mimeType = payload.media.mimetype || 'image/jpeg';
    
    return [{
      json: {
        imageSource: 'web_base64',
        imageData: base64Data,
        mimeType: mimeType,
        originalPayload: payload
      },
      binary: {
        image: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    }];
  } else {
    // URL from WhatsApp (existing logic)
    return [{
      json: {
        imageSource: 'whatsapp_url',
        imageUrl: mediaUrl,
        originalPayload: payload
      }
    }];
  }
}

return [{ json: { error: 'No valid image found' } }];
```

### Step 3: Update AI Processing

Ensure your AI agent can handle both:
- Binary image data (from web interface)
- Downloaded images (from WhatsApp URLs)

### Step 4: Add Response Handling

```json
{
  "message": "{{ $('AI Agent Img , Text').item.json.output }}",
  "type": "image_analysis",
  "processedBy": "{{ $json.imageSource }}"
}
```

## Testing Image Upload

### Using the Web Interface:

1. **Open the chat interface**
2. **Click the attachment button (📎)**
3. **Select an image file**
4. **Image should appear in chat**
5. **Bot should respond with analysis**

### Using test.html:

The test page doesn't have image upload, but you can test the payload structure by modifying the custom message test.

## Supported Image Formats

The web interface supports:
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

Maximum file size: **10MB** (configurable)

## Troubleshooting Image Upload

### Common Issues:

1. **Image not detected in n8n:**
   - Check if `hasMedia: true` in the payload
   - Verify the switch condition matches exactly

2. **Base64 processing fails:**
   - Ensure base64 data is properly extracted
   - Check for data URL format: `data:image/jpeg;base64,`

3. **AI agent doesn't process image:**
   - Verify binary data is correctly formatted
   - Check AI agent configuration for image input

4. **No response after image upload:**
   - Add "Respond to Webhook" node after image processing
   - Check for errors in n8n execution log

### Debug Tips:

1. **Add debug nodes** to see the payload structure
2. **Log the media object** to understand the data format
3. **Test with small images first** (< 1MB)
4. **Check browser console** for upload errors

## Advanced Image Features

### Image with Caption:

If you want users to send images with text captions, modify the frontend to include both:

```json
{
  "hasMedia": true,
  "body": "Analyze this chart please",
  "media": {
    "url": "data:image/jpeg;base64,...",
    "mimetype": "image/jpeg"
  }
}
```

### Multiple Images:

For multiple image support, you'd need to modify the frontend and n8n workflow to handle arrays of images.

### Image Response:

Your n8n workflow can also send images back:

```json
{
  "message": "Here's the analyzed chart with annotations:",
  "imageUrl": "https://your-processed-image-url.com/annotated.png",
  "type": "processed_image"
}
```

This allows for two-way image communication between user and bot.
