// Example configuration for Saham Bot Web Interface
// Copy this file to config.js and update with your settings

const CONFIG = {
    // Your n8n webhook URL
    // Get this from your n8n workflow webhook node
    webhookUrl: 'https://your-n8n-instance.com/webhook/your-webhook-id',
    
    // Default session ID for the web interface
    // This will be used for conversation memory in your n8n workflow
    defaultSessionId: 'web-session-001',
    
    // Your phone number (without + or @c.us)
    // This simulates the WhatsApp sender ID
    defaultUserPhone: '6281234567890',
    
    // UI Configuration
    ui: {
        // App title shown in header
        title: 'Saham Bot',
        
        // Welcome message configuration
        welcomeMessage: {
            title: 'Welcome to Saham Bot!',
            subtitle: 'I can help you with:',
            features: [
                'Stock Analysis: Type "IDX:BBCA" for stock analysis',
                'General Chat: Ask any questions about stocks',
                'Image Analysis: Upload images for analysis'
            ]
        },
        
        // Theme colors (optional customization)
        theme: {
            primaryColor: '#25D366',
            secondaryColor: '#128C7E',
            backgroundColor: '#f0f2f5'
        }
    },
    
    // Message type detection patterns
    messageTypes: {
        stock: {
            patterns: ['IDX:', 'IHSG', 'saham'],
            groupId: '120363401195590086@g.us'
        },
        crypto: {
            patterns: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto'],
            groupId: '120363400022989092@g.us'
        },
        imageGen: {
            patterns: ['#GAMBAR:'],
            groupId: null
        }
    },
    
    // Bot mention configuration
    botMention: {
        phoneNumber: '6285179647256@c.us',
        triggerWords: ['bot', 'help', 'saham', 'analisis']
    },
    
    // API Configuration
    api: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000 // 1 second
    }
};

// Export configuration if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.SAHAM_BOT_CONFIG = CONFIG;
}
