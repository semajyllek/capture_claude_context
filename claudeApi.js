// claudeApi.js
window.ClaudeAPI = {
    async getApiKey() {
        const key = prompt('Please enter your Claude API key:');
        if (key) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ 
                    type: 'SET_API_KEY', 
                    apiKey: key 
                }, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(key);
                    }
                });
            });
        }
        return null;
    },

    async generateContext(messages) {
        try {
            console.log('Sending context generation request...');
            
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: 'GENERATE_CONTEXT',
                    messages: messages
                }, response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }

                    if (response.error) {
                        reject(new Error(response.error));
                        return;
                    }

                    if (response.needApiKey) {
                        this.getApiKey()
                            .then(key => {
                                if (!key) {
                                    reject(new Error('API key required'));
                                    return;
                                }
                                return this.generateContext(messages);
                            })
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    resolve(response.content);
                });
            });
        } catch (error) {
            console.error('Error generating context:', error);
            throw error;
        }
    }
};