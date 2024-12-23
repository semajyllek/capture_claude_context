window.UIController = {
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
            animation: slideUp 0.3s ease-out, fadeOut 0.5s ease-in 4.5s;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { transform: translate(-50%, 100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 5000);
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
                
                this.updateButtonText(button, 'Copied!');
                
                setTimeout(() => {
                    button.disabled = false;
                    this.resetButtonText(button);
                }, 2000);
                
            } catch (error) {
                console.error('Button click error:', error);
                this.updateButtonText(button, 'Error - check console');
                button.disabled = false;
                setTimeout(() => {
                    this.resetButtonText(button);
                }, 2000);
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