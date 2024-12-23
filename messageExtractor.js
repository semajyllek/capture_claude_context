window.MessageExtractor = {
    // Helper to extract filename from code comments/markers
    extractFilename(codeText) {
        if (!codeText || typeof codeText !== 'string') return null;
        
        // Look for common filename indicators
        const filenameMatches = codeText.match(/(?:filename:|file:|#\s*filename:?|\/\/\s*filename:?|\/\*\s*filename:?|\*\s*filename:?)\s*([^\n\r]+)/i);
        if (filenameMatches) {
            return filenameMatches[1].trim();
        }
        return null;
    },

    // Parse code blocks from text
    parseCodeBlocks(text) {
        const blocks = [];
        const regex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            blocks.push({
                language: match[1],
                code: match[2].trim()
            });
        }
        
        return blocks;
    },

    // Process all code blocks from messages
    processCodeBlocks(messages) {
        const fileVersions = new Map();
        const unnamedCodeBlocks = [];
        const definitionVersions = new Map();

        messages.forEach(msg => {
            const content = msg.content || '';
            const codeBlocks = this.parseCodeBlocks(content);
            
            codeBlocks.forEach(({language, code}) => {
                const filename = this.extractFilename(code);
                window.CodeParser.processCodeBlock(
                    code, 
                    language, 
                    filename, 
                    fileVersions, 
                    unnamedCodeBlocks, 
                    definitionVersions
                );
            });
        });

        return {
            namedFiles: fileVersions,
            unnamedBlocks: unnamedCodeBlocks,
            definitions: definitionVersions
        };
    },

    async waitForCodeContent(button) {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            const codeBlock = node.querySelector('.code-block__code, pre code, .language-javascript, .language-python, pre, code');
                            if (codeBlock) {
                                obs.disconnect();
                                resolve(codeBlock);
                                return;
                            }
                        }
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            button.click();
            
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, 2000);
        });
    },

    async extractChatContent() {
        let userMessages = [];
        let assistantMessages = [];
        
        const messageGroups = document.querySelectorAll('[data-test-render-count]');
        
        for (const group of messageGroups) {
            const userBlock = group.querySelector('.group [data-testid="user-message"]');
            if (userBlock) {
                userMessages.push({
                    role: 'user',
                    content: userBlock.textContent.trim()
                });
            }
            
            const claudeMessage = group.querySelector('.font-claude-message');
            if (claudeMessage) {
                let content = '';
                
                // Handle code preview buttons
                const buttons = Array.from(claudeMessage.querySelectorAll('button[aria-label="Preview contents"]'));
                
                for (const button of buttons) {
                    const codeBlock = await this.waitForCodeContent(button);
                    if (codeBlock) {
                        const classNames = Array.from(codeBlock.classList || []);
                        const language = classNames.find(c => c.startsWith('language-'))?.split('-')[1] || '';
                        content += `\`\`\`${language}\n${codeBlock.textContent.trim()}\n\`\`\`\n\n`;
                    }
                }
                
                // Add regular text content
                const textSections = claudeMessage.querySelectorAll('.grid-cols-1.grid.gap-2\\.5 > *');
                for (const section of textSections) {
                    if (!section.querySelector('button')) {
                        content += section.textContent.trim() + '\n\n';
                    }
                }

                if (content) {
                    assistantMessages.push({
                        role: 'assistant',
                        content: content.trim()
                    });
                }
            }
        }

        // Take last 100 messages
        userMessages = userMessages.slice(-100);
        assistantMessages = assistantMessages.slice(-100);

        // Interleave messages chronologically
        const messages = [];
        const maxLen = Math.max(userMessages.length, assistantMessages.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < userMessages.length) messages.push(userMessages[i]);
            if (i < assistantMessages.length) messages.push(assistantMessages[i]);
        }

        return {
            messages: messages,
            codeBlocks: this.processCodeBlocks(messages)
        };
    }
};