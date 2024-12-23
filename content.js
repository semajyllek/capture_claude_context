async function waitForCodeContent(button) {
    return new Promise((resolve) => {
        // Create a temporary observer just for this button click
        const observer = new MutationObserver((mutations, obs) => {
            // Look for added code blocks in the mutations
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const codeBlock = node.querySelector('.code-block__code, .language-javascript, .language-python');
                        if (codeBlock) {
                            console.log('Found injected code:', codeBlock.textContent.substring(0, 100));
                            obs.disconnect();
                            resolve(codeBlock);
                            return;
                        }
                    }
                }
            }
        });
        
        // Start observing before clicking
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Click the button
        console.log('Clicking button:', button.textContent);
        button.click();
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, 2000);
    });
}

async function extractChatContent() {
    console.log('Starting extraction...');
    const messages = [];
    
    // Find all message groups
    const messageGroups = document.querySelectorAll('[data-test-render-count]');
    console.log(`Found ${messageGroups.length} message groups`);
    
    for (const group of messageGroups) {
        // Extract user messages
        const userBlock = group.querySelector('.group [data-testid="user-message"]');
        if (userBlock) {
            console.log('Found user message:', userBlock.textContent.trim().substring(0, 50));
            messages.push({
                role: 'user',
                content: userBlock.textContent.trim()
            });
        }
        
        // Extract Claude's responses
        const claudeMessage = group.querySelector('.font-claude-message');
        if (claudeMessage) {
            console.log('Found Claude message');
            let content = '';
            
            // First get any regular text content
            const textSections = claudeMessage.querySelectorAll('.grid-cols-1.grid.gap-2\\.5 > p');
            for (const section of textSections) {
                if (!section.querySelector('button')) {
                    content += section.textContent.trim() + '\n\n';
                }
            }
            
            // Then look for code preview buttons
            const buttons = Array.from(claudeMessage.querySelectorAll('button[aria-label="Preview contents"]'));
            console.log(`Found ${buttons.length} code buttons`);
            
            // Process each button
            for (const button of buttons) {
                const codeBlock = await waitForCodeContent(button);
                if (codeBlock) {
                    const language = codeBlock.className.split('language-')[1]?.split(' ')[0] || '';
                    content += `\`\`\`${language}\n${codeBlock.textContent.trim()}\n\`\`\`\n\n`;
                }
            }

            if (content) {
                messages.push({
                    role: 'assistant',
                    content: content.trim()
                });
            }
        }
    }

    console.log('Extracted messages:', messages);
    return messages;
}

async function initialize() {
    console.log('Starting initialization...');
    
    // Wait for initial chat content
    await waitForElements();
    
    // Set up observer for new messages
    const observer = new MutationObserver((mutations) => {
        const hasRelevantChanges = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && (
                    node.querySelector('[data-testid="user-message"]') ||
                    node.querySelector('.font-claude-message')
                )
            )
        );
        
        if (hasRelevantChanges) {
            console.log('New message detected, waiting before extraction...');
            setTimeout(extractChatContent, 1000);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Observer set up');
}

function waitForElements() {
    let attempts = 0;
    const maxAttempts = 50;
    
    return new Promise((resolve) => {
        const check = async () => {
            attempts++;
            console.log(`Checking for elements (attempt ${attempts})...`);
            
            const messageGroups = document.querySelectorAll('[data-test-render-count]');
            if (messageGroups.length > 0) {
                console.log('Found message groups, extracting...');
                await extractChatContent();
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('Max attempts reached');
                resolve(false);
                return;
            }
            
            setTimeout(check, 500);
        };
        
        check();
    });
}

// Start the script
console.log('Content script loaded');
initialize();