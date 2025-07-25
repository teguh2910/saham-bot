# Deployment Guide - Saham Bot Web Interface

This guide will help you deploy the Saham Bot web interface and integrate it with your existing n8n workflow.

## Prerequisites

- Your existing n8n workflow is running and accessible
- Basic understanding of web hosting
- Access to modify your n8n workflow (optional but recommended)

## Step 1: Prepare Your n8n Workflow

### Option A: Minimal Changes (Recommended)
Your existing workflow will work with minimal changes:

1. **Add a Webhook Node** (if not already present):
   - Add a "Webhook" node at the start of your workflow
   - Set HTTP Method to "POST"
   - Set Response Mode to "Respond to Webhook"
   - Copy the webhook URL

2. **Optional: Add Response Formatting**:
   - Add a "Set" node before the final WhatsApp response nodes
   - Configure it to format responses for the web interface:
   ```json
   {
     "message": "{{ $('AI-chart').item.json.output }}",
     "type": "text"
   }
   ```

### Option B: Enhanced Integration
For better integration, modify your workflow to return structured responses:

1. **Replace WhatsApp Response Nodes**:
   - Replace "Send a text message" nodes with "Respond to Webhook" nodes
   - Format responses as JSON:
   ```json
   {
     "message": "{{ $('AI Agent Img , Text').item.json.output }}",
     "type": "text",
     "timestamp": "{{ $now }}"
   }
   ```

2. **Handle Chart Responses**:
   - For chart responses, return:
   ```json
   {
     "message": "Here's your stock analysis:",
     "imageUrl": "{{ $('Get Chart URL').item.json.url }}",
     "type": "chart"
   }
   ```

## Step 2: Deploy the Web Interface

### Option A: Simple File Hosting

1. **Upload Files**:
   - Upload all files (`index.html`, `styles.css`, `script.js`) to your web server
   - Ensure they're in the same directory

2. **Test Locally First**:
   ```bash
   # If you have Python installed
   python -m http.server 8000
   
   # Or if you have Node.js
   npx serve .
   
   # Then open http://localhost:8000
   ```

### Option B: GitHub Pages (Free)

1. **Create a GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/saham-bot-web.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Your app will be available at `https://yourusername.github.io/saham-bot-web`

### Option C: Netlify (Free with Custom Domain)

1. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your project folder
   - Or connect your GitHub repository

2. **Configure Custom Domain** (optional):
   - Add your domain in Netlify settings
   - Update DNS records as instructed

### Option D: Vercel (Free)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

## Step 3: Configure CORS (If Needed)

If your n8n instance is on a different domain, configure CORS:

### n8n Cloud/Self-hosted with Docker:
Add environment variable:
```bash
N8N_CORS_ORIGIN=https://your-web-interface-domain.com
```

### n8n Self-hosted (Manual):
1. Go to n8n Settings > Security
2. Add your web interface domain to "Allowed Origins"
3. Or use `*` for development (not recommended for production)

## Step 4: Test the Integration

1. **Open Your Web Interface**
2. **Configure Settings**:
   - Click the settings icon (⚙️)
   - Enter your n8n webhook URL
   - Set a session ID
   - Enter your phone number

3. **Test Different Message Types**:
   - `IDX:BBCA` - Stock analysis
   - `#GAMBAR: sunset` - Image generation
   - `What is Bitcoin?` - Crypto query
   - Upload an image - Image analysis

## Step 5: Production Considerations

### Security
- Use HTTPS for both n8n and web interface
- Implement rate limiting if needed
- Consider authentication for sensitive workflows
- Don't expose sensitive webhook URLs publicly

### Performance
- Enable gzip compression on your web server
- Use a CDN for static assets
- Monitor n8n workflow execution times

### Monitoring
- Set up monitoring for your n8n instance
- Monitor web interface usage
- Log errors for debugging

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   ```
   Access to fetch at 'n8n-url' from origin 'web-interface-url' has been blocked by CORS policy
   ```
   **Solution**: Configure CORS in n8n settings

2. **Webhook Not Found (404)**:
   ```
   HTTP error! status: 404
   ```
   **Solution**: Check webhook URL is correct and workflow is active

3. **No Response from n8n**:
   - Check n8n workflow execution logs
   - Verify webhook node configuration
   - Ensure workflow doesn't have errors

4. **Images Not Loading**:
   - Check image URLs are accessible
   - Verify CORS for image domains
   - Ensure proper image format

### Debug Mode

Enable debug mode by adding to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

This will log all requests and responses for troubleshooting.

## Advanced Configuration

### Custom Styling
Modify `styles.css` to match your brand:
```css
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-secondary-color;
}
```

### Custom Message Types
Add new message type detection in `script.js`:
```javascript
detectMessageType(message) {
    // Add your custom patterns
    if (message.startsWith('FOREX:')) {
        return 'forex';
    }
    // ... existing code
}
```

### Integration with Existing Website
Embed the chat interface in your existing website:
```html
<iframe 
    src="https://your-saham-bot-domain.com" 
    width="400" 
    height="600"
    frameborder="0">
</iframe>
```

## Support and Maintenance

### Regular Updates
- Keep n8n updated
- Monitor for security updates
- Update webhook URLs if they change

### Backup
- Backup your n8n workflows
- Keep a copy of your web interface files
- Document your configuration

### Scaling
- Consider using a load balancer for high traffic
- Monitor n8n resource usage
- Implement caching if needed

## Next Steps

After successful deployment:
1. Share the web interface with your users
2. Gather feedback and iterate
3. Consider adding new features
4. Monitor usage and performance
5. Plan for scaling if needed

For additional support, check the main README.md file or review the n8n documentation.
