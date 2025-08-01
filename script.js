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
            webhookUrl: localStorage.getItem('webhookUrl') || 'https://worker1.servercikarang.cloud/webhook/teguh',
            ragWebhookUrl: localStorage.getItem('ragWebhookUrl') || 'https://n8n.servercikarang.cloud/webhook/teguh-rag',
            sessionId: localStorage.getItem('sessionId') || this.generateSessionId(),
            userPhone: localStorage.getItem('userPhone') || '6281234567890',
            imgbbApiKey: localStorage.getItem('imgbbApiKey') || ''
        };

        // Chat history
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        this.maxHistoryItems = 50; // Limit history to prevent storage overflow
        
        this.initializeEventListeners();
        this.loadSettings();
        this.loadChatHistory();
        this.updateSessionInfo();
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

        // History modal
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistory();
        });

        document.getElementById('closeHistory').addEventListener('click', () => {
            this.hideHistory();
        });

        document.getElementById('closeHistoryFooter').addEventListener('click', () => {
            this.hideHistory();
        });

        document.getElementById('exportHistory').addEventListener('click', () => {
            this.exportHistory();
        });

        document.getElementById('clearAllHistory').addEventListener('click', () => {
            this.clearAllHistory();
        });

        // New chat modal
        document.getElementById('closeNewChat').addEventListener('click', () => {
            this.hideNewChatModal();
        });

        document.getElementById('cancelNewChat').addEventListener('click', () => {
            this.hideNewChatModal();
        });

        document.getElementById('confirmNewChat').addEventListener('click', () => {
            this.startNewChatSession();
        });

        // File management modal - with null checks
        const filesBtnEl = document.getElementById('filesBtn');
        if (filesBtnEl) {
            filesBtnEl.addEventListener('click', () => {
                this.showFilesModal();
            });
        }

        const closeFilesEl = document.getElementById('closeFiles');
        if (closeFilesEl) {
            closeFilesEl.addEventListener('click', () => {
                this.hideFilesModal();
            });
        }

        const closeFilesFooterEl = document.getElementById('closeFilesFooter');
        if (closeFilesFooterEl) {
            closeFilesFooterEl.addEventListener('click', () => {
                this.hideFilesModal();
            });
        }

        const uploadBtnEl = document.getElementById('uploadBtn');
        if (uploadBtnEl) {
            uploadBtnEl.addEventListener('click', () => {
                const fileUploadEl = document.getElementById('fileUpload');
                if (fileUploadEl) {
                    fileUploadEl.click();
                }
            });
        }

        const fileUploadEl = document.getElementById('fileUpload');
        if (fileUploadEl) {
            fileUploadEl.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        const refreshFilesEl = document.getElementById('refreshFiles');
        if (refreshFilesEl) {
            refreshFilesEl.addEventListener('click', () => {
                this.loadFilesList();
            });
        }

        // File filters - with null checks
        const fileTypeFilterEl = document.getElementById('fileTypeFilter');
        if (fileTypeFilterEl) {
            fileTypeFilterEl.addEventListener('change', () => {
                this.filterFiles();
            });
        }

        const fileSortByEl = document.getElementById('fileSortBy');
        if (fileSortByEl) {
            fileSortByEl.addEventListener('change', () => {
                this.sortFiles();
            });
        }

        const fileSearchInputEl = document.getElementById('fileSearchInput');
        if (fileSearchInputEl) {
            fileSearchInputEl.addEventListener('input', () => {
                this.filterFiles();
            });
        }
        
        // New chat session
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.showNewChatModal();
        });

        // Clear chat
        const clearChatEl = document.getElementById('clearChat');
        if (clearChatEl) {
            clearChatEl.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // Test image responses
        const testImageBtnEl = document.getElementById('testImageBtn');
        if (testImageBtnEl) {
            testImageBtnEl.addEventListener('click', () => {
                this.testImageResponse();
            });
        }
        
        // Close modal on backdrop click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });

        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('historyModal')) {
                this.hideHistory();
            }
        });

        document.getElementById('newChatModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('newChatModal')) {
                this.hideNewChatModal();
            }
        });

        
        document.getElementById('filesModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('filesModal')) {
                this.hideFilesModal();
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
            // Debug: Log the response to console for troubleshooting
            console.log('🔍 n8n Response received:', response);

            // Handle different response types from n8n workflow
            if (response && typeof response === 'object') {
                // Handle binary file responses (base64 encoded)
                if (response.binary || response.file || response.attachment) {
                    console.log('📁 Processing binary response');
                    await this.handleBinaryResponse(response);
                    return;
                }

                // Handle text responses
                if (response.message || response.text || response.output) {
                    const text = response.message || response.text || response.output;
                    console.log('💬 Adding text message:', text.substring(0, 100) + '...');
                    this.addMessage(text, 'bot');
                }

                // Enhanced image detection - check multiple possible field names
                const imageUrl = this.extractImageUrl(response);
                if (imageUrl) {
                    console.log('🖼️ Found image URL:', imageUrl);
                    this.addImageMessage(imageUrl, 'bot');
                }

                // Handle file download responses
                if (response.downloadUrl || response.fileUrl) {
                    const fileUrl = response.downloadUrl || response.fileUrl;
                    const fileName = response.fileName || response.filename || 'download';
                    console.log('📄 Adding file download:', fileName);
                    this.addFileMessage(fileUrl, fileName, 'bot');
                }

                // Handle multiple responses (array)
                if (Array.isArray(response)) {
                    console.log('📋 Processing array response with', response.length, 'items');
                    for (const item of response) {
                        await this.handleResponse(item);
                        await this.delay(500); // Small delay between multiple responses
                    }
                    return;
                }

                // Check if response has no recognized fields but might contain image data
                if (!response.message && !response.text && !response.output &&
                    !response.binary && !response.file && !response.attachment &&
                    !response.downloadUrl && !response.fileUrl) {

                    // Try to extract image from any field
                    const imageUrl = this.extractImageUrl(response);
                    if (imageUrl) {
                        console.log('🖼️ Found image in unstructured response:', imageUrl);
                        this.addImageMessage(imageUrl, 'bot');
                        return;
                    }

                    // If no image found, show the raw response as text
                    console.log('❓ Unrecognized response format, showing as text');
                    this.addMessage(JSON.stringify(response, null, 2), 'bot');
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

                // Handle combined text and file responses
                if (response.text && (response.binary || response.file)) {
                    this.addMessage(response.text, 'bot');
                    await this.delay(300);
                    await this.handleBinaryResponse(response);
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

    extractImageUrl(response) {
        // Check for various possible image URL field names
        const possibleImageFields = [
            'imageUrl', 'image_url', 'image', 'chartUrl', 'chart_url', 'chart',
            'url', 'link', 'src', 'href', 'path', 'file_url', 'fileUrl',
            'attachment_url', 'attachmentUrl', 'media_url', 'mediaUrl',
            'picture', 'photo', 'img', 'graphic', 'visualization'
        ];

        for (const field of possibleImageFields) {
            if (response[field]) {
                const url = response[field];
                // Check if it's a valid URL or base64 image
                if (typeof url === 'string' && (
                    url.startsWith('http') ||
                    url.startsWith('https') ||
                    url.startsWith('data:image/') ||
                    url.startsWith('blob:')
                )) {
                    return url;
                }
            }
        }

        // Check nested objects for image URLs
        if (response.data && typeof response.data === 'object') {
            return this.extractImageUrl(response.data);
        }

        if (response.result && typeof response.result === 'object') {
            return this.extractImageUrl(response.result);
        }

        if (response.output && typeof response.output === 'object') {
            return this.extractImageUrl(response.output);
        }

        // Check if any field contains what looks like an image URL
        for (const [key, value] of Object.entries(response)) {
            if (typeof value === 'string' && (
                value.includes('.jpg') || value.includes('.jpeg') ||
                value.includes('.png') || value.includes('.gif') ||
                value.includes('.webp') || value.includes('.svg') ||
                value.startsWith('data:image/') || value.startsWith('blob:')
            )) {
                return value;
            }
        }

        return null;
    }

    // Test method to simulate different response formats (for debugging)
    testImageResponse() {
        console.log('🧪 Testing different image response formats...');

        // Test 1: Standard imageUrl format
        this.handleResponse({
            message: "Here's your chart:",
            imageUrl: "https://picsum.photos/400/300?random=1"
        });

        setTimeout(() => {
            // Test 2: Alternative field names
            this.handleResponse({
                text: "Alternative format:",
                image: "https://picsum.photos/400/300?random=2"
            });
        }, 2000);

        setTimeout(() => {
            // Test 3: Nested response (like your n8n format)
            this.handleResponse({
                data: {
                    chart_url: "https://picsum.photos/400/300?random=3"
                },
                message: "Nested format:"
            });
        }, 4000);

        setTimeout(() => {
            // Test 4: Your actual n8n format with image
            this.handleResponse([{
                output: "Here's your stock analysis with chart:",
                imageUrl: "https://picsum.photos/400/300?random=4"
            }]);
        }, 6000);

        setTimeout(() => {
            // Test 5: Base64 image (1x1 red pixel)
            this.handleResponse({
                text: "Base64 format:",
                binary: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                mimeType: "image/png",
                fileName: "test.png"
            });
        }, 8000);
    }

    async handleBinaryResponse(response) {
        try {
            const binaryData = response.binary || response.file || response.attachment;
            const mimeType = response.mimeType || response.contentType || 'application/octet-stream';
            const fileName = response.fileName || response.filename || 'file';

            // Handle base64 encoded binary data
            if (typeof binaryData === 'string') {
                // Create blob from base64 data
                const byteCharacters = atob(binaryData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Create object URL for the blob
                const fileUrl = URL.createObjectURL(blob);

                // Handle different file types
                if (mimeType.startsWith('image/')) {
                    this.addImageMessage(fileUrl, 'bot', fileName);
                } else if (mimeType.startsWith('video/')) {
                    this.addVideoMessage(fileUrl, 'bot', fileName);
                } else if (mimeType.startsWith('audio/')) {
                    this.addAudioMessage(fileUrl, 'bot', fileName);
                } else {
                    this.addFileMessage(fileUrl, fileName, 'bot', mimeType);
                }
            }
            // Handle direct blob/buffer data
            else if (binaryData instanceof ArrayBuffer || binaryData instanceof Uint8Array) {
                const blob = new Blob([binaryData], { type: mimeType });
                const fileUrl = URL.createObjectURL(blob);

                if (mimeType.startsWith('image/')) {
                    this.addImageMessage(fileUrl, 'bot', fileName);
                } else if (mimeType.startsWith('video/')) {
                    this.addVideoMessage(fileUrl, 'bot', fileName);
                } else if (mimeType.startsWith('audio/')) {
                    this.addAudioMessage(fileUrl, 'bot', fileName);
                } else {
                    this.addFileMessage(fileUrl, fileName, 'bot', mimeType);
                }
            }
            // Handle URL-based binary responses
            else if (typeof binaryData === 'object' && binaryData.url) {
                if (mimeType.startsWith('image/')) {
                    this.addImageMessage(binaryData.url, 'bot', fileName);
                } else if (mimeType.startsWith('video/')) {
                    this.addVideoMessage(binaryData.url, 'bot', fileName);
                } else if (mimeType.startsWith('audio/')) {
                    this.addAudioMessage(binaryData.url, 'bot', fileName);
                } else {
                    this.addFileMessage(binaryData.url, fileName, 'bot', mimeType);
                }
            }

        } catch (error) {
            console.error('Error handling binary response:', error);
            this.addMessage('❌ Error processing file from server.', 'bot');
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
        const timestamp = new Date();

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

            // Format bot messages with enhanced styling
            if (sender === 'bot') {
                textDiv.innerHTML = this.formatBotMessage(text);
            } else {
                textDiv.textContent = text;
            }

            bubbleDiv.appendChild(textDiv);
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        bubbleDiv.appendChild(timeDiv);

        messageDiv.appendChild(bubbleDiv);

        // Remove welcome message if it exists
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to chat history
        this.saveChatMessage(text, sender, imageUrl, timestamp);
    }
    
    addImageMessage(imageUrl, sender, fileName = null) {
        this.addMessage('', sender, imageUrl);
    }

    addVideoMessage(videoUrl, sender, fileName = 'video') {
        const timestamp = new Date();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const videoHtml = `
            <div class="message-content">
                <div class="file-attachment video-attachment">
                    <div class="file-header">
                        <i class="fas fa-video"></i>
                        <span class="file-name">${fileName}</span>
                        <a href="${videoUrl}" download="${fileName}" class="download-btn" title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                    <video controls class="video-preview">
                        <source src="${videoUrl}" type="video/mp4">
                        <source src="${videoUrl}" type="video/webm">
                        <source src="${videoUrl}" type="video/ogg">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="message-time">${timestamp.toLocaleTimeString()}</div>
            </div>
        `;

        messageDiv.innerHTML = videoHtml;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to chat history
        this.saveChatMessage(`[Video: ${fileName}]`, sender, null, timestamp);
    }

    addAudioMessage(audioUrl, sender, fileName = 'audio') {
        const timestamp = new Date();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const audioHtml = `
            <div class="message-content">
                <div class="file-attachment audio-attachment">
                    <div class="file-header">
                        <i class="fas fa-music"></i>
                        <span class="file-name">${fileName}</span>
                        <a href="${audioUrl}" download="${fileName}" class="download-btn" title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                    <audio controls class="audio-preview">
                        <source src="${audioUrl}" type="audio/mpeg">
                        <source src="${audioUrl}" type="audio/wav">
                        <source src="${audioUrl}" type="audio/ogg">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
                <div class="message-time">${timestamp.toLocaleTimeString()}</div>
            </div>
        `;

        messageDiv.innerHTML = audioHtml;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to chat history
        this.saveChatMessage(`[Audio: ${fileName}]`, sender, null, timestamp);
    }

    addFileMessage(fileUrl, fileName, sender, mimeType = 'application/octet-stream') {
        const timestamp = new Date();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        // Get file icon based on mime type or extension
        const fileIcon = this.getFileIcon(fileName, mimeType);
        const fileSize = this.getFileSizeFromUrl(fileUrl);

        const fileHtml = `
            <div class="message-content">
                <div class="file-attachment document-attachment">
                    <div class="file-header">
                        <i class="${fileIcon}"></i>
                        <div class="file-info">
                            <span class="file-name">${fileName}</span>
                            <span class="file-size">${fileSize}</span>
                        </div>
                        <a href="${fileUrl}" download="${fileName}" class="download-btn" title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                    <div class="file-preview">
                        <p>Click download to save this file</p>
                    </div>
                </div>
                <div class="message-time">${timestamp.toLocaleTimeString()}</div>
            </div>
        `;

        messageDiv.innerHTML = fileHtml;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to chat history
        this.saveChatMessage(`[File: ${fileName}]`, sender, null, timestamp);
    }

    getFileIcon(fileName, mimeType) {
        const extension = fileName.split('.').pop()?.toLowerCase();

        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') return 'fas fa-file-word';
        if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('rar') || extension === 'zip' || extension === 'rar') return 'fas fa-file-archive';
        if (mimeType.includes('text') || extension === 'txt') return 'fas fa-file-alt';

        return 'fas fa-file';
    }

    getFileSizeFromUrl(url) {
        // This is a placeholder - in real implementation you might want to fetch file size
        return 'Unknown size';
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
        document.getElementById('ragWebhookUrl').value = this.settings.ragWebhookUrl;
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
        this.settings.ragWebhookUrl = document.getElementById('ragWebhookUrl').value.trim();
        this.settings.sessionId = document.getElementById('sessionId').value.trim() || this.generateSessionId();
        this.settings.userPhone = document.getElementById('userPhone').value.trim();
        this.settings.imgbbApiKey = document.getElementById('imgbbApiKey').value.trim();

        // Validate webhook URLs
        if (this.settings.webhookUrl && !this.isValidUrl(this.settings.webhookUrl)) {
            this.showError('Please enter a valid main webhook URL.');
            return;
        }

        if (this.settings.ragWebhookUrl && !this.isValidUrl(this.settings.ragWebhookUrl)) {
            this.showError('Please enter a valid RAG webhook URL.');
            return;
        }

        // Save to localStorage
        localStorage.setItem('webhookUrl', this.settings.webhookUrl);
        localStorage.setItem('ragWebhookUrl', this.settings.ragWebhookUrl);
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
        this.updateSessionInfo();
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
        if (confirm('Clear current chat? This will permanently delete the current conversation.')) {
            // Remove all messages from display
            const messages = this.messagesContainer.querySelectorAll('.message, .error-message, .success-message');
            messages.forEach(message => message.remove());

            // Clear chat history for current session
            this.chatHistory = this.chatHistory.filter(msg =>
                msg.sessionId !== this.settings.sessionId
            );
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));

            // Show welcome message again
            this.showWelcomeMessage();

            this.showSuccess('Current chat cleared successfully!');
        }
    }

    saveChatMessage(text, sender, imageUrl, timestamp) {
        const message = {
            id: Date.now() + Math.random(),
            text: text || '',
            sender: sender,
            imageUrl: imageUrl || null,
            timestamp: timestamp.toISOString(),
            sessionId: this.settings.sessionId
        };

        this.chatHistory.push(message);

        // Limit history size
        if (this.chatHistory.length > this.maxHistoryItems) {
            this.chatHistory = this.chatHistory.slice(-this.maxHistoryItems);
        }

        // Save to localStorage
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));

        // Update session info display
        this.updateSessionInfo();
    }

    loadChatHistory() {
        // Load and display chat history for current session
        const currentSessionHistory = this.chatHistory.filter(msg =>
            msg.sessionId === this.settings.sessionId
        );

        if (currentSessionHistory.length > 0) {
            // Remove welcome message
            const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }

            // Display historical messages
            currentSessionHistory.forEach(msg => {
                this.displayHistoricalMessage(msg);
            });

            this.scrollToBottom();
        }
    }

    displayHistoricalMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';

        if (message.imageUrl) {
            const img = document.createElement('img');
            img.src = message.imageUrl;
            img.className = 'message-image';
            img.alt = 'Historical image';
            bubbleDiv.appendChild(img);
        }

        if (message.text) {
            const textDiv = document.createElement('div');

            // Format bot messages with enhanced styling
            if (message.sender === 'bot') {
                textDiv.innerHTML = this.formatBotMessage(message.text);
            } else {
                textDiv.textContent = message.text;
            }

            bubbleDiv.appendChild(textDiv);
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        const msgTime = new Date(message.timestamp);
        timeDiv.textContent = msgTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        bubbleDiv.appendChild(timeDiv);

        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
    }

    showHistory() {
        this.populateHistoryModal();
        document.getElementById('historyModal').style.display = 'flex';
    }

    hideHistory() {
        document.getElementById('historyModal').style.display = 'none';
    }

    populateHistoryModal() {
        const historyStats = document.getElementById('historyStats');
        const historySessions = document.getElementById('historySessions');

        // Group messages by session
        const sessionGroups = {};
        this.chatHistory.forEach(msg => {
            if (!sessionGroups[msg.sessionId]) {
                sessionGroups[msg.sessionId] = [];
            }
            sessionGroups[msg.sessionId].push(msg);
        });

        // Update stats
        const totalSessions = Object.keys(sessionGroups).length;
        const totalMessages = this.chatHistory.length;
        historyStats.textContent = `${totalSessions} sessions, ${totalMessages} messages`;

        // Clear previous content
        historySessions.innerHTML = '';

        // Create session elements
        Object.entries(sessionGroups).forEach(([sessionId, messages]) => {
            const sessionDiv = this.createSessionElement(sessionId, messages);
            historySessions.appendChild(sessionDiv);
        });

        if (totalSessions === 0) {
            historySessions.innerHTML = '<p style="text-align: center; color: #54656f; padding: 40px;">No chat history found</p>';
        }
    }

    createSessionElement(sessionId, messages) {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'history-session';

        const firstMessage = messages[0];
        const messageCount = messages.length;

        const sessionDate = new Date(firstMessage.timestamp).toLocaleDateString();
        const sessionTime = new Date(firstMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const isCurrentSession = sessionId === this.settings.sessionId;

        sessionDiv.innerHTML = `
            <div class="session-header" onclick="this.parentElement.querySelector('.session-messages').classList.toggle('expanded')">
                <div class="session-info">
                    <h4>${isCurrentSession ? 'Current Session' : 'Session'} - ${sessionDate}</h4>
                    <p>${messageCount} messages • Started at ${sessionTime}</p>
                </div>
                <div class="session-actions" onclick="event.stopPropagation()">
                    <button onclick="window.sahamBotInstance.loadSession('${sessionId}')" title="Load Session">
                        <i class="fas fa-upload"></i>
                    </button>
                    <button onclick="window.sahamBotInstance.deleteSession('${sessionId}')" title="Delete Session">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="session-messages">
                ${messages.map(msg => this.createHistoryMessageElement(msg)).join('')}
            </div>
        `;

        return sessionDiv;
    }

    createHistoryMessageElement(message) {
        const msgTime = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const imageHtml = message.imageUrl ? `<img src="${message.imageUrl}" class="history-message-image" alt="Message image">` : '';

        let textHtml = '';
        if (message.text) {
            if (message.sender === 'bot') {
                // Use simplified formatting for history view
                textHtml = `<div>${this.formatBotMessage(message.text)}</div>`;
            } else {
                textHtml = `<div>${message.text}</div>`;
            }
        }

        return `
            <div class="history-message ${message.sender}">
                <div class="history-message-bubble">
                    ${imageHtml}
                    ${textHtml}
                    <div class="history-message-time">${msgTime}</div>
                </div>
            </div>
        `;
    }

    loadSession(sessionId) {
        if (confirm('Load this session? Current chat will be cleared.')) {
            // Clear current chat
            this.clearChat();

            // Update session ID
            this.settings.sessionId = sessionId;
            localStorage.setItem('sessionId', sessionId);

            // Load the session
            this.loadChatHistory();

            // Close history modal
            this.hideHistory();

            this.showSuccess('Session loaded successfully!');
        }
    }

    deleteSession(sessionId) {
        if (confirm('Delete this session permanently?')) {
            // Remove messages from this session
            this.chatHistory = this.chatHistory.filter(msg => msg.sessionId !== sessionId);
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));

            // Refresh the history modal
            this.populateHistoryModal();

            this.showSuccess('Session deleted successfully!');
        }
    }

    exportHistory() {
        const dataStr = JSON.stringify(this.chatHistory, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `saham-bot-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showSuccess('Chat history exported successfully!');
    }

    clearAllHistory() {
        if (confirm('Clear all chat history permanently? This cannot be undone.')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            this.populateHistoryModal();
            this.showSuccess('All chat history cleared!');
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        this.messagesContainer.appendChild(successDiv);
        this.scrollToBottom();

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    showNewChatModal() {
        document.getElementById('newChatModal').style.display = 'flex';
    }

    hideNewChatModal() {
        document.getElementById('newChatModal').style.display = 'none';
    }

    startNewChatSession() {
        // Save current session if it has messages
        const currentSessionMessages = this.chatHistory.filter(msg =>
            msg.sessionId === this.settings.sessionId
        );

        if (currentSessionMessages.length > 0) {
            // Current session already saved automatically
            this.showSuccess(`Previous session saved with ${currentSessionMessages.length} messages`);
        }

        // Generate new session ID
        const newSessionId = this.generateSessionId();

        // Update settings
        this.settings.sessionId = newSessionId;
        localStorage.setItem('sessionId', newSessionId);

        // Clear current chat display
        this.clearChatDisplay();

        // Hide modal
        this.hideNewChatModal();

        // Show welcome message for new session
        this.showWelcomeMessage();

        // Update status
        this.updateSessionStatus();

        this.showSuccess('🎉 New chat session started! Previous conversation saved to history.');
    }

    clearChatDisplay() {
        // Remove all messages from display only (don't affect history)
        const messages = this.messagesContainer.querySelectorAll('.message, .error-message, .success-message');
        messages.forEach(message => message.remove());
    }

    showWelcomeMessage() {
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
                        <li><strong>General Chat:</strong> Ask any questions about stocks</li>
                        <li><strong>Image Analysis:</strong> Upload images for analysis</li>
                    </ul>
                </div>
            `;
            this.messagesContainer.appendChild(welcomeDiv);
        }
    }

    updateSessionStatus() {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'New Session';
            setTimeout(() => {
                status.textContent = this.settings.webhookUrl ? 'Ready' : 'Configure webhook';
            }, 2000);
        }
        this.updateSessionInfo();
    }

    updateSessionInfo() {
        const sessionInfo = document.getElementById('sessionInfo');
        if (sessionInfo) {
            const sessionId = this.settings.sessionId;
            const shortId = sessionId.replace('web-session-', '');
            const messageCount = this.chatHistory.filter(msg => msg.sessionId === sessionId).length;
            sessionInfo.textContent = `Session: ${shortId} (${messageCount} messages)`;
        }
    }

    showRagModal() {
        if (!this.settings.ragWebhookUrl) {
            this.showError('Please configure your RAG webhook URL in settings first.');
            this.showSettings();
            return;
        }

        // Clear previous search
        document.getElementById('ragQuery').value = '';
        document.getElementById('ragStatus').style.display = 'none';

        // Remove any previous results
        const existingResults = document.querySelector('.rag-results');
        if (existingResults) {
            existingResults.remove();
        }

        document.getElementById('ragModal').style.display = 'flex';
        document.getElementById('ragQuery').focus();
    }

    hideRagModal() {
        document.getElementById('ragModal').style.display = 'none';
    }

    async performRagSearch() {
        const query = document.getElementById('ragQuery').value.trim();
        const maxResults = document.getElementById('ragMaxResults').value;
        const similarityThreshold = document.getElementById('ragSimilarityThreshold').value;

        if (!query) {
            this.showError('Please enter a question to search.');
            return;
        }

        if (!this.settings.ragWebhookUrl) {
            this.showError('RAG webhook URL not configured. Please check settings.');
            return;
        }

        // Show loading status
        const statusDiv = document.getElementById('ragStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Searching knowledge base...</p>';

        // Disable search button
        const searchBtn = document.getElementById('searchRag');
        searchBtn.disabled = true;

        try {
            // Prepare RAG payload
            const payload = {
                query: query,
                maxResults: parseInt(maxResults),
                similarityThreshold: parseFloat(similarityThreshold),
                sessionId: this.settings.sessionId,
                timestamp: new Date().toISOString()
            };

            // Send to RAG webhook
            const response = await fetch(this.settings.ragWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();

            // Display results
            this.displayRagResults(results, query);

        } catch (error) {
            console.error('RAG search error:', error);
            statusDiv.innerHTML = `<p style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> Search failed: ${error.message}</p>`;
        } finally {
            searchBtn.disabled = false;
        }
    }

    formatBotMessage(text) {
        // Simple formatting for bot messages - keep it clean and readable
        let formatted = text;

        // Apply basic formatting without complex layouts
        formatted = this.applySimpleFormatting(formatted);

        return formatted;
    }

    applySimpleFormatting(text) {
        let formatted = text;

        // Convert line breaks to HTML breaks for proper display
        formatted = formatted.replace(/\n/g, '<br>');

        // Format bold text (keep **text** as bold)
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Format italic text (keep *text* as italic)
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Keep the text clean and simple - no complex layouts
        return formatted;
    }



    showFilesModal() {
        document.getElementById('filesModal').style.display = 'flex';
        this.loadFilesList();
    }

    hideFilesModal() {
        document.getElementById('filesModal').style.display = 'none';
    }

    async loadFilesList() {
        const filesList = document.getElementById('filesList');
        const filesStats = document.getElementById('filesStats');

        // Show loading
        filesList.innerHTML = '<div class="empty-files"><i class="fas fa-spinner fa-spin"></i><p>Loading files...</p></div>';
        filesStats.textContent = 'Loading...';

        try {
            // Request files list from RAG service
            const response = await fetch(`${this.settings.ragWebhookUrl}/files`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayFilesList(data.files || []);

            // Update stats
            const totalFiles = data.files ? data.files.length : 0;
            const totalSize = data.files ? data.files.reduce((sum, file) => sum + (file.size || 0), 0) : 0;
            filesStats.textContent = `${totalFiles} files • ${this.formatFileSize(totalSize)}`;

        } catch (error) {
            console.error('Failed to load files:', error);
            filesList.innerHTML = `
                <div class="empty-files">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load files: ${error.message}</p>
                    <button class="btn-primary" onclick="window.sahamBotInstance.loadFilesList()">Retry</button>
                </div>
            `;
            filesStats.textContent = 'Error loading files';
        }
    }

    displayFilesList(files) {
        const filesList = document.getElementById('filesList');

        if (!files || files.length === 0) {
            filesList.innerHTML = `
                <div class="empty-files">
                    <i class="fas fa-folder-open"></i>
                    <p>No files uploaded yet</p>
                    <p>Upload documents to build your knowledge base</p>
                </div>
            `;
            return;
        }

        // Store files for filtering/sorting
        this.currentFiles = files;

        // Apply current filters and sorting
        this.filterAndSortFiles();
    }

    filterAndSortFiles() {
        if (!this.currentFiles) return;

        let filteredFiles = [...this.currentFiles];

        // Apply type filter
        const typeFilter = document.getElementById('fileTypeFilter').value;
        if (typeFilter) {
            filteredFiles = filteredFiles.filter(file =>
                file.name.toLowerCase().endsWith(`.${typeFilter}`)
            );
        }

        // Apply search filter
        const searchTerm = document.getElementById('fileSearchInput').value.toLowerCase();
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file =>
                file.name.toLowerCase().includes(searchTerm) ||
                (file.description && file.description.toLowerCase().includes(searchTerm))
            );
        }

        // Apply sorting
        const sortBy = document.getElementById('fileSortBy').value;
        filteredFiles.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.uploadDate || b.created_at || 0) - new Date(a.uploadDate || a.created_at || 0);
                case 'size':
                    return (b.size || 0) - (a.size || 0);
                case 'status':
                    return (a.status || 'pending').localeCompare(b.status || 'pending');
                default:
                    return 0;
            }
        });

        this.renderFilesList(filteredFiles);
    }

    renderFilesList(files) {
        const filesList = document.getElementById('filesList');

        const filesHtml = files.map(file => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileIcon = this.getFileIcon(fileExt);
            const fileSize = this.formatFileSize(file.size || 0);
            const uploadDate = file.uploadDate || file.created_at ?
                new Date(file.uploadDate || file.created_at).toLocaleDateString() : 'Unknown';
            const status = file.status || 'pending';

            return `
                <div class="file-item" data-file-id="${file.id || file.name}">
                    <div class="file-icon ${fileExt}">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-details">Uploaded: ${uploadDate}</div>
                    </div>
                    <div class="file-size">${fileSize}</div>
                    <div class="file-status ${status}">${status}</div>
                    <div class="file-actions">
                        <button title="Download" onclick="window.sahamBotInstance.downloadFile('${file.id || file.name}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button title="View Details" onclick="window.sahamBotInstance.viewFileDetails('${file.id || file.name}')">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn-danger" title="Delete" onclick="window.sahamBotInstance.deleteFile('${file.id || file.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        filesList.innerHTML = filesHtml;
    }

    getFileIcon(extension) {
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'txt': 'fa-file-alt',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'md': 'fa-file-code',
            'default': 'fa-file'
        };
        return iconMap[extension] || iconMap.default;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    filterFiles() {
        this.filterAndSortFiles();
    }

    sortFiles() {
        this.filterAndSortFiles();
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        if (!this.settings.ragWebhookUrl) {
            this.showError('RAG webhook URL not configured. Please check settings.');
            return;
        }

        const progressDiv = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressDiv.style.display = 'block';

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Update progress
                const progress = ((i + 1) / files.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Uploading ${file.name} (${i + 1}/${files.length})`;

                await this.uploadSingleFile(file);
            }

            // Upload complete
            progressText.textContent = 'Upload complete!';
            this.showSuccess(`Successfully uploaded ${files.length} file(s)`);

            // Refresh files list
            setTimeout(() => {
                this.loadFilesList();
                progressDiv.style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('Upload failed:', error);
            this.showError(`Upload failed: ${error.message}`);
            progressDiv.style.display = 'none';
        }

        // Reset file input
        document.getElementById('fileUpload').value = '';
    }

    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', this.settings.sessionId);
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch(`${this.settings.ragWebhookUrl}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}: ${response.status}`);
        }

        return await response.json();
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.settings.ragWebhookUrl}/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showSuccess('File deleted successfully');
            this.loadFilesList();

        } catch (error) {
            console.error('Delete failed:', error);
            this.showError(`Failed to delete file: ${error.message}`);
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await fetch(`${this.settings.ragWebhookUrl}/files/${fileId}/download`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileId; // You might want to get the actual filename from response headers
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Download failed:', error);
            this.showError(`Failed to download file: ${error.message}`);
        }
    }

    async viewFileDetails(fileId) {
        try {
            const response = await fetch(`${this.settings.ragWebhookUrl}/files/${fileId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const fileDetails = await response.json();
            this.showFileDetailsModal(fileDetails);

        } catch (error) {
            console.error('Failed to get file details:', error);
            this.showError(`Failed to get file details: ${error.message}`);
        }
    }

    showFileDetailsModal(fileDetails) {
        // Create a simple details display
        const detailsHtml = `
            <div class="file-details-modal">
                <h4>${fileDetails.name}</h4>
                <p><strong>Size:</strong> ${this.formatFileSize(fileDetails.size || 0)}</p>
                <p><strong>Type:</strong> ${fileDetails.type || 'Unknown'}</p>
                <p><strong>Status:</strong> ${fileDetails.status || 'Unknown'}</p>
                <p><strong>Upload Date:</strong> ${fileDetails.uploadDate ? new Date(fileDetails.uploadDate).toLocaleString() : 'Unknown'}</p>
                ${fileDetails.description ? `<p><strong>Description:</strong> ${fileDetails.description}</p>` : ''}
                ${fileDetails.preview ? `<div class="file-preview">${fileDetails.preview}</div>` : ''}
            </div>
        `;

        // You could create a proper modal for this, but for now just show an alert
        // In a real implementation, you'd want a proper modal
        alert(`File Details:\n\nName: ${fileDetails.name}\nSize: ${this.formatFileSize(fileDetails.size || 0)}\nStatus: ${fileDetails.status || 'Unknown'}`);
    }
}

// Initialize the bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sahamBotInstance = new SahamBot();
});
