# Saham Bot Web Interface

A frontend web application that replaces WhatsApp as the input/output channel for your n8n stock analysis workflow.

## Features

- **WhatsApp-like Chat Interface**: Familiar messaging experience
- **Stock Analysis**: Type `IDX:BBCA` for stock chart analysis
- **General Chat**: AI-powered stock market discussions
- **Image Analysis**: Upload images for AI analysis
- **Chat History**: Automatic saving and restoration of conversations
- **Session Management**: Multiple chat sessions with easy switching
- **Real-time Typing Indicators**: Natural conversation flow
- **Image Hosting**: Automatic upload to hosting services (ImgBB/TmpFiles)
- **Export/Import**: Export chat history as JSON files
- **Responsive Design**: Works on desktop and mobile

## Setup Instructions

### 1. Configure Your n8n Workflow

Your existing n8n workflow needs a small modification to work with the web interface:

1. **Add a Webhook Trigger** (if not already present):
   - Add a new "Webhook" node at the beginning of your workflow
   - Set HTTP Method to "POST"
   - Copy the webhook URL

2. **Modify Response Format** (optional):
   - Add a "Respond to Webhook" node at the end of your workflow
   - Configure it to return JSON responses like:
   ```json
   {
     "message": "{{ $('AI-chart').item.json.output }}",
     "type": "text"
   }
   ```

### 2. Deploy the Web Interface

#### Option A: Local Development
1. Clone or download the files to a local directory
2. Open `index.html` in a web browser
3. Configure the webhook URL in settings

#### Option B: Web Server Deployment
1. Upload files to your web server
2. Ensure HTTPS if your n8n instance uses HTTPS
3. Configure CORS in n8n if needed

### 3. Configure the Application

1. Click the settings icon (⚙️) in the chat header
2. Enter your configuration:
   - **n8n Webhook URL**: Your workflow webhook URL
   - **Session ID**: Unique identifier for this session
   - **Phone Number**: Your phone number (without + or @c.us)

### 4. Test the Integration

Try these example messages:
- `IDX:BBCA` - Stock analysis
- `#GAMBAR: sunset over mountains` - Image generation
- `What is Bitcoin?` - Crypto query
- Upload an image for analysis

## Configuration Details

### Webhook URL Format
```
https://your-n8n-instance.com/webhook/your-webhook-id
```

### Session ID
- Used for conversation memory in your n8n workflow
- Can be any unique string
- Automatically generated if not provided

### Phone Number Format
- Enter without country code prefix or @c.us suffix
- Example: `6281234567890` (not `+6281234567890@c.us`)

## Supported Message Types

### Stock Analysis
- Format: `IDX:TICKER`
- Example: `IDX:BBCA`, `IDX:TLKM`
- Triggers chart generation and AI analysis

### Image Generation
- Format: `#GAMBAR: description`
- Example: `#GAMBAR: beautiful sunset over mountains`
- Generates AI images based on description

### Crypto Queries
- Any message about cryptocurrency
- Routed to crypto-specific AI agent
- Example: `What is the current Bitcoin price?`

### General Chat
- Any other text message
- Processed by general stock market AI
- Has access to vector store knowledge

### Image Analysis
- Upload images using the attachment button (📎)
- AI analyzes the image content
- Supports JPEG, PNG, and other common formats
- Images automatically uploaded to hosting services

### Chat History
- **Automatic Saving**: All conversations are automatically saved
- **Session Management**: Each session has a unique ID for organization
- **History Browser**: Click the history button (🕒) to view past conversations
- **Session Loading**: Load any previous session to continue conversations
- **Export Feature**: Export chat history as JSON files
- **Session Deletion**: Delete individual sessions or clear all history
- **Cross-Session Storage**: History persists across browser sessions

## Troubleshooting

### Common Issues

1. **"Please configure webhook URL" error**
   - Solution: Add your n8n webhook URL in settings

2. **Messages not sending**
   - Check webhook URL is correct
   - Ensure n8n workflow is active
   - Check browser console for errors

3. **No responses received**
   - Verify n8n workflow has proper response handling
   - Check if workflow execution completed successfully
   - Ensure CORS is configured if needed

4. **Images not uploading**
   - Check file size (keep under 10MB)
   - Ensure supported image format
   - Verify n8n can handle base64 image data

### CORS Configuration

If your n8n instance is on a different domain, you may need to configure CORS:

1. In n8n, go to Settings > Security
2. Add your web interface domain to allowed origins
3. Or use `*` for development (not recommended for production)

## Technical Details

### Data Flow
1. User types message in web interface
2. Frontend formats message to match n8n payload structure
3. HTTP POST request sent to n8n webhook
4. n8n workflow processes the request
5. Response displayed in chat interface

### Payload Format
The web interface sends data in the same format as your WhatsApp integration:

```json
{
  "session": "web-session-123",
  "payload": {
    "id": "web_1234567890",
    "from": "6281234567890@c.us",
    "body": "IDX:BBCA",
    "_data": {
      "body": "IDX:BBCA",
      "from": "6281234567890@c.us",
      "quotedParticipant": null,
      "mentionedJidList": []
    },
    "hasMedia": false,
    "timestamp": 1234567890
  }
}
```

### Security Considerations

- Store webhook URLs securely
- Use HTTPS in production
- Implement rate limiting if needed
- Consider authentication for sensitive workflows

## Customization

### Styling
- Modify `styles.css` to change appearance
- Colors, fonts, and layout can be customized
- Responsive design works on all screen sizes

### Functionality
- Edit `script.js` to add new features
- Modify payload format if needed
- Add new message types or handlers

### Integration
- Can be embedded in existing websites
- Supports iframe integration
- API can be extended for other use cases

## Support

For issues related to:
- **Web Interface**: Check browser console and network tab
- **n8n Workflow**: Check n8n execution logs
- **Integration**: Verify payload format and webhook configuration

## License

This project is provided as-is for integration with your existing n8n workflow.
