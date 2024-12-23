window.CodeParser = {
    // Extract function/class signature (e.g., "def prepare_model(model_name):" or "class ModelTrainer:")
    extractSignature(line) {
        const functionMatch = line.match(/^\s*(def\s+\w+\s*\([^)]*\))/);
        const classMatch = line.match(/^\s*(class\s+\w+\s*(?:\([^)]*\))?)/);
        return functionMatch?.[1] || classMatch?.[1] || null;
    },

    // Get indentation level of a line
    getIndentation(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    },

    // Extract a complete function or class definition based on indentation
    extractDefinitionBlock(lines, startIndex) {
        if (startIndex >= lines.length) return null;

        const firstLine = lines[startIndex];
        const baseIndent = this.getIndentation(firstLine);
        const block = [firstLine];
        
        let i = startIndex + 1;
        while (i < lines.length) {
            const line = lines[i];
            const indent = this.getIndentation(line);
            
            // Empty lines or comments at the same indentation are part of the block
            if (line.trim() === '' || line.trim().startsWith('#')) {
                block.push(line);
                i++;
                continue;
            }
            
            // If we find a line with same or less indentation, we're done
            if (indent <= baseIndent && line.trim() !== '') {
                break;
            }
            
            block.push(line);
            i++;
        }
        
        return {
            text: block.join('\n'),
            endIndex: i - 1
        };
    },

    // Parse a code block and extract all function/class definitions
    parseDefinitions(codeText) {
        const definitions = new Map();
        const lines = codeText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trimEnd(); // Remove trailing whitespace
            const signature = this.extractSignature(line);
            
            if (signature) {
                const block = this.extractDefinitionBlock(lines, i);
                if (block) {
                    definitions.set(signature, block.text);
                    i = block.endIndex;
                }
            }
        }
        
        return definitions;
    },

    // Process a code block and update tracked definitions
    processCodeBlock(code, language, filename, fileVersions, unnamedCodeBlocks, definitionVersions) {
        if (language === 'python' || filename?.endsWith('.py')) {
            const definitions = this.parseDefinitions(code);
            
            // Update our tracked definitions with latest versions
            definitions.forEach((defText, signature) => {
                definitionVersions.set(signature, defText);
            });
            
            if (filename) {
                // Reconstruct file content with latest definitions
                const latestDefs = Array.from(definitions.values()).join('\n\n');
                fileVersions.set(filename, `\`\`\`python\n${latestDefs}\n\`\`\``);
            } else {
                // For unnamed blocks, add if it contains definitions we haven't seen
                let hasNewDefs = false;
                definitions.forEach((_, signature) => {
                    if (!definitionVersions.has(signature)) hasNewDefs = true;
                });
                if (hasNewDefs) {
                    unnamedCodeBlocks.push(`\`\`\`python\n${code}\n\`\`\``);
                }
            }
        } else {
            // For non-Python files, keep track of most recent version by filename
            const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``;
            if (filename) {
                fileVersions.set(filename, formattedCode);
            } else {
                unnamedCodeBlocks.push(formattedCode);
            }
        }
    }
};