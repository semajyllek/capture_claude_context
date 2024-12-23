let apiKey = '';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.type);
    
    if (request.type === 'SET_API_KEY') {
        apiKey = request.apiKey;
        sendResponse({ success: true });
        return false;
    }
    
    if (request.type === 'GENERATE_CONTEXT') {
        // Need to return true to use async sendResponse
        handleGenerateContext(request.messages)
            .then(sendResponse)
            .catch(error => {
                console.error('Background error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Will respond asynchronously
    }
});

async function handleGenerateContext(messages) {
    if (!apiKey) {
        return { needApiKey: true };
    }

    const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
    const CONTEXT_PROMPT = `Analyze this conversation and provide context that maintains continuity. Focus on:

1. UNRESOLVED IDEAS AND OPPORTUNITIES:
   a. Implementation ideas mentioned but not explored
   b. Related approaches suggested in passing
   c. Technical questions raised but not answered
   d. Potential optimizations or extensions discussed

2. CURRENT STATE:
   a. What's being built/learned/solved right now
   b. Latest approach being attempted
   c. Immediate challenges or blockers
   d. Next implementation steps

Make sure you answer every question and provide a clear, concise summary. 
Use formatted code blocks where necessary.

Here is the conversation to analyze:`;

    const prompt = `${CONTEXT_PROMPT}\n\n${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`;

    try {
        console.log('Calling Claude API...');
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': apiKey,
                'anthropic-beta': 'messages-2023-12-15',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                system: "You extract relevant context focusing on unimplemented ideas and current state. Be brief and specific."
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error details:', errorData);
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Got context from Claude:', data);
        return { content: data.content[0].text };
    } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
    }
}