// Saham Bot Web Interface
class SahamBot {
    constructor() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.settingsModal = document.getElementById('settingsModal');
        this.imageInput = document.getElementById('imageInput');
        
        // Settings
        this.settings = {
            webhookUrl: localStorage.getItem('webhookUrl') || '',
            sessionId: localStorage.getItem('sessionId') || this.generateSessionId(),
            userPhone: localStorage.getItem('userPhone') || '6281234567890',
            imgbbApiKey: localStorage.getItem('imgbbApiKey') || ''
        };
        
        this.initializeEventListeners();
        this.loadSettings();
    }
    
    generateSessionId() {
        return 'web-session-' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeEventListeners() {
        // Send message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Image upload
        document.getElementById('attachBtn').addEventListener('click', () => {
            this.imageInput.click();
        });
        
        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettings();
        });
        
        document.getElementById('cancelSettings').addEventListener('click', () => {
            this.hideSettings();
        });
        
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Clear chat
        document.getElementById('clearChat').addEventListener('click', () => {
            this.clearChat();
        });
        
        // Close modal on backdrop click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        if (!this.settings.webhookUrl) {
            this.showError('Please configure your n8n webhook URL in settings first.');
            this.showSettings();
            return;
        }
        
        // Clear input and disable send button
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        try {
            // Prepare payload for n8n workflow
            const payload = this.preparePayload(message);
            
            // Send to n8n webhook
            const response = await this.sendToN8n(payload);
            
            // Handle response
            await this.handleResponse(response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please check your connection and settings.');
        } finally {
            this.hideTyping();
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }
    
    preparePayload(message) {
        // Format payload to match n8n workflow expectations
        const now = new Date();
        const messageId = 'web_' + now.getTime();

        // Detect message type and adjust payload accordingly
        const messageType = this.detectMessageType(message);
        let fromField = this.settings.userPhone + '@c.us';

        // Simulate different group sources based on message type
        if (messageType === 'crypto') {
            fromField = '120363400022989092@g.us'; // Crypto group ID from your workflow
        } else if (messageType === 'stock') {
            fromField = '120363401195590086@g.us'; // Stock group ID from your workflow
        }

        return {
            session: this.settings.sessionId,
            payload: {
                id: messageId,
                from: fromField,
                body: message,
                _data: {
                    body: message,
                    from: fromField,
                    quotedParticipant: null,
                    mentionedJidList: this.detectMentions(message)
                },
                hasMedia: false,
                timestamp: Math.floor(now.getTime() / 1000)
            }
        };
    }

    detectMessageType(message) {
        const lowerMessage = message.toLowerCase();

        // Stock analysis pattern
        if (message.startsWith('IDX:')) {
            return 'stock';
        }

        // Image generation pattern
        if (message.startsWith('#GAMBAR:')) {
            return 'image_gen';
        }

        // Crypto keywords
        const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'coin', 'token'];
        if (cryptoKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'crypto';
        }

        // Default to general chat
        return 'general';
    }

    detectMentions(message) {
        // Check if message should trigger mention-based responses
        const mentionKeywords = ['bot', 'help', 'saham', 'analisis'];
        const lowerMessage = message.toLowerCase();

        if (mentionKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return ['6285179647256@c.us']; // Bot's phone number from your workflow
        }

        return [];
    }
    
    async sendToN8n(payload) {
        try {
            const response = await fetch(this.settings.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                timeout: 30000 // 30 second timeout
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Ignore JSON parsing errors for error responses
                }
                throw new Error(errorMessage);
            }

            // Handle different response types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                // Handle text responses
                const text = await response.text();
                return { message: text };
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to n8n webhook. Please check your URL and internet connection.');
            }
            throw error;
        }
    }
    
    async handleResponse(response) {
        // Simulate typing delay for more natural feel
        await this.delay(1000 + Math.random() * 2000);

        try {
            // Handle different response types from n8n workflow
            if (response && typeof response === 'object') {
                // Handle text responses
                if (response.message || response.text || response.output) {
                    const text = response.message || response.text || response.output;
                    this.addMessage(text, 'bot');
                }

                // Handle image/chart responses
                if (response.imageUrl || response.chartUrl || response.url) {
                    const imageUrl = response.imageUrl || response.chartUrl || response.url;
                    this.addImageMessage(imageUrl, 'bot');
                }

                // Handle multiple responses (array)
                if (Array.isArray(response)) {
                    for (const item of response) {
                        await this.handleResponse(item);
                        await this.delay(500); // Small delay between multiple responses
                    }
                    return;
                }

                // Handle error responses
                if (response.error) {
                    this.showError(response.error);
                    return;
                }

                // Handle quota/limit responses
                if (response.message && response.message.toLowerCase().includes('kuota')) {
                    this.addMessage(response.message, 'bot');
                    return;
                }

            } else if (typeof response === 'string') {
                // Handle plain string responses
                this.addMessage(response, 'bot');
            } else {
                // Fallback for successful workflow execution without specific response
                this.addMessage('✅ Your request has been processed successfully.', 'bot');
            }

        } catch (error) {
            console.error('Error handling response:', error);
            this.showError('Error processing the response from the workflow.');
        }
    }
    
    async handleImageUpload(file) {
        if (!this.settings.webhookUrl) {
            this.showError('Please configure your n8n webhook URL in settings first.');
            this.showSettings();
            return;
        }

        // Show image in chat
        const imageUrl = URL.createObjectURL(file);
        this.addImageMessage(imageUrl, 'user');

        // Show typing indicator
        this.showTyping();

        try {
            // Upload image to hosting service and get URL
            const hostedImageUrl = await this.uploadImageToHost(file);

            // Prepare payload with image URL (not base64)
            const payload = this.prepareImageUrlPayload(hostedImageUrl, file.type);

            // Send to n8n
            const response = await this.sendToN8n(payload);

            // Handle response
            await this.handleResponse(response);

        } catch (error) {
            console.error('Error uploading image:', error);
            this.showError('Failed to upload image. Please try again.');
        } finally {
            this.hideTyping();
        }
    }
    
    async uploadImageToHost(file) {
        // Option 1: Use imgbb.com (free image hosting) - if API key is configured
        if (this.settings.imgbbApiKey) {
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.settings.imgbbApiKey}`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Image uploaded to ImgBB:', result.data.url);
                    return result.data.url;
                }
            } catch (error) {
                console.log('ImgBB upload failed, trying alternative...', error);
            }
        }

        // Option 2: Use temporary file hosting (no API key needed)
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                return result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            }
        } catch (error) {
            console.log('TmpFiles upload failed, trying base64 fallback...');
        }

        // Option 3: Fallback to base64 (original method)
        const base64 = await this.fileToBase64(file);
        return base64;
    }

    prepareImageUrlPayload(imageUrl, mimeType) {
        const now = new Date();
        const messageId = 'web_img_' + now.getTime();

        // If it's a base64 fallback, use the original format
        if (imageUrl.startsWith('data:')) {
            return {
                session: this.settings.sessionId,
                payload: {
                    id: messageId,
                    from: this.settings.userPhone + '@c.us',
                    body: '',
                    _data: {
                        body: '',
                        from: this.settings.userPhone + '@c.us',
                        quotedParticipant: null,
                        mentionedJidList: []
                    },
                    hasMedia: true,
                    media: {
                        url: imageUrl,
                        mimetype: mimeType
                    },
                    timestamp: Math.floor(now.getTime() / 1000)
                }
            };
        }

        // For hosted URLs, use a simpler format
        return {
            session: this.settings.sessionId,
            payload: {
                id: messageId,
                from: this.settings.userPhone + '@c.us',
                body: '',
                _data: {
                    body: '',
                    from: this.settings.userPhone + '@c.us',
                    quotedParticipant: null,
                    mentionedJidList: []
                },
                hasMedia: true,
                media: {
                    url: imageUrl,
                    mimetype: mimeType
                },
                timestamp: Math.floor(now.getTime() / 1000)
            }
        };
    }

    prepareImagePayload(base64Data, mimeType) {
        // Keep original method for backward compatibility
        return this.prepareImageUrlPayload(base64Data, mimeType);
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    addMessage(text, sender, imageUrl = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'message-image';
            img.alt = 'Uploaded image';
            bubbleDiv.appendChild(img);
        }
        
        if (text) {
            const textDiv = document.createElement('div');
            textDiv.textContent = text;
            bubbleDiv.appendChild(textDiv);
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        bubbleDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(bubbleDiv);
        
        // Remove welcome message if it exists
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addImageMessage(imageUrl, sender) {
        this.addMessage('', sender, imageUrl);
    }
    
    showTyping() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.typingIndicator.style.display = 'none';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showSettings() {
        // Load current settings into form
        document.getElementById('webhookUrl').value = this.settings.webhookUrl;
        document.getElementById('sessionId').value = this.settings.sessionId;
        document.getElementById('userPhone').value = this.settings.userPhone;
        document.getElementById('imgbbApiKey').value = this.settings.imgbbApiKey;

        this.settingsModal.style.display = 'flex';
    }
    
    hideSettings() {
        this.settingsModal.style.display = 'none';
    }
    
    saveSettings() {
        // Get values from form
        this.settings.webhookUrl = document.getElementById('webhookUrl').value.trim();
        this.settings.sessionId = document.getElementById('sessionId').value.trim() || this.generateSessionId();
        this.settings.userPhone = document.getElementById('userPhone').value.trim();
        this.settings.imgbbApiKey = document.getElementById('imgbbApiKey').value.trim();

        // Validate webhook URL
        if (this.settings.webhookUrl && !this.isValidUrl(this.settings.webhookUrl)) {
            this.showError('Please enter a valid webhook URL.');
            return;
        }

        // Save to localStorage
        localStorage.setItem('webhookUrl', this.settings.webhookUrl);
        localStorage.setItem('sessionId', this.settings.sessionId);
        localStorage.setItem('userPhone', this.settings.userPhone);
        localStorage.setItem('imgbbApiKey', this.settings.imgbbApiKey);
        
        this.hideSettings();
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = 'Settings saved successfully!';
        this.messagesContainer.appendChild(successDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
    
    loadSettings() {
        // Settings are already loaded in constructor
        // Update UI if needed
        const status = document.getElementById('status');
        if (this.settings.webhookUrl) {
            status.textContent = 'Ready';
        } else {
            status.textContent = 'Configure webhook';
        }
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    clearChat() {
        // Remove all messages except welcome message
        const messages = this.messagesContainer.querySelectorAll('.message, .error-message, .success-message');
        messages.forEach(message => message.remove());
        
        // Show welcome message again
        if (!this.messagesContainer.querySelector('.welcome-message')) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-message';
            welcomeDiv.innerHTML = `
                <div class="welcome-content">
                    <i class="fas fa-robot"></i>
                    <h3>Welcome to Saham Bot!</h3>
                    <p>I can help you with:</p>
                    <ul>
                        <li><strong>Stock Analysis:</strong> Type "IDX:BBCA" for stock analysis</li>
                        <li><strong>Image Generation:</strong> Type "#GAMBAR: your description"</li>
                        <li><strong>Crypto Info:</strong> Ask about cryptocurrency</li>
                        <li><strong>General Chat:</strong> Ask any questions about stocks</li>
                        <li><strong>Image Analysis:</strong> Upload images for analysis</li>
                    </ul>
                </div>
            `;
            this.messagesContainer.appendChild(welcomeDiv);
        }
    }
}

// Initialize the bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SahamBot();
});
