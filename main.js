async function handleContextGeneration() {
    try {
        console.log('Starting context generation...');
        const extracted = await window.MessageExtractor.extractChatContent();
        console.log('Extracted content:', extracted);

        // Format code blocks into a string
        let codeSection = '===CODE BLOCKS===\n\n';
        
        // Add named files first
        extracted.codeBlocks.namedFiles.forEach((code, filename) => {
            codeSection += `# ${filename}\n${code}\n\n`;
        });
        
        // Add unnamed blocks
        extracted.codeBlocks.unnamedBlocks.forEach(code => {
            codeSection += `${code}\n\n`;
        });

        // Prepend code section to messages for API call
        const messagesWithCode = [
            { role: 'user', content: codeSection }, // Send code first
            ...extracted.messages                   // Then the conversation
        ];

        // Get Claude's analysis
        const claudeResponse = await window.ClaudeAPI.generateContext(messagesWithCode);
        
        // Format final context
        const finalContext = `${codeSection}\n${claudeResponse}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(finalContext);
        return true;
    } catch (error) {
        console.error('Context generation error:', error);
        throw error;
    }
}

async function initialize() {
    console.log('Starting initialization...');
    window.UIController.addContextButton(handleContextGeneration);
}

// Start the script
console.log('Content script loaded');
initialize();