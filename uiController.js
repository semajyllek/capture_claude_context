window.UIController = {
    showNotification(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-3 bg-[#F3F1FF] rounded-lg shadow-md text-[#4A3F8D] border border-[#E5E1FF]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm45.66 85.66-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32Z"/>
                </svg>
                ${message}
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            animation: slideUpAndStay 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUpAndStay {
                from { transform: translate(-50%, 100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Display for 7 seconds before fading out
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s ease-in';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 500);
        }, 7000);
    },

    createContextButton() {
        const button = document.createElement('button');
        button.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-2 bg-bg-400 rounded-md hover:bg-bg-500 text-text-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8z"/>
                </svg>
                Capture Context
            </div>
        `;
        
        button.style.cssText = `
            position: fixed;
            left: 0;
            top: calc(50% + 80px);
            transform: translateY(-50%);
            z-index: 9999;
            cursor: pointer;
            pointer-events: auto;
            padding: 8px;
            border: none;
            background: none;
            outline: none;
        `;

        button.addEventListener('mouseover', () => {
            button.querySelector('div').classList.add('bg-bg-500');
        });
        button.addEventListener('mouseout', () => {
            button.querySelector('div').classList.remove('bg-bg-500');
        });

        return button;
    },

    async addContextButton(onClickCallback) {
        console.log('Adding context button...');
        const button = this.createContextButton();
        
        button.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Button clicked!');

            try {
                button.disabled = true;
                this.updateButtonText(button, 'Capturing...');
                
                await onClickCallback();
                
                this.showNotification('Context copied to clipboard!');
                this.resetButtonText(button);
                button.disabled = false;
                
            } catch (error) {
                console.error('Button click error:', error);
                this.showNotification('Error - check console');
                this.resetButtonText(button);
                button.disabled = false;
            }
        };

        document.body.appendChild(button);
        console.log('Button added to page');
        return button;
    },

    updateButtonText(button, text) {
        button.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-2 bg-bg-400 rounded-md text-text-100">
                ${text}
            </div>
        `;
    },

    resetButtonText(button) {
        button.innerHTML = `
            <div class="flex items-center gap-2 px-4 py-2 bg-bg-400 rounded-md hover:bg-bg-500 text-text-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8z"/>
                </svg>
                Capture Context
            </div>
        `;
    }
};