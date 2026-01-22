// Chat functionality
class ChatApp {
    constructor() {
        this.messages = [{ role: "assistant", content: "Ask me anything, cutie?" }];
        this.isThinking = false;
        this.init();
    }

    init() {
        this.chatToggle = document.getElementById('chat-toggle');
        this.chatModal = document.getElementById('chat-modal');
        this.chatClose = document.getElementById('chat-close');
        this.chatInput = document.getElementById('chat-input');
        this.chatSend = document.getElementById('chat-send');
        this.chatMessages = document.getElementById('chat-messages');

        this.bindEvents();
        this.renderMessages();
    }

    bindEvents() {
        this.chatToggle.addEventListener('click', () => this.openChat());
        this.chatClose.addEventListener('click', () => this.closeChat());
        this.chatSend.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close modal when clicking overlay
        this.chatModal.addEventListener('click', (e) => {
            if (e.target === this.chatModal) {
                this.closeChat();
            }
        });
    }

    openChat() {
        this.chatModal.classList.add('active');
    }

    closeChat() {
        this.chatModal.classList.remove('active');
    }

    async sendMessage() {
        const input = this.chatInput.value.trim();
        if (!input || this.isThinking) return;

        const userMessage = { role: "user", content: input };
        this.messages.push(userMessage);
        this.chatInput.value = "";
        this.renderMessages();
        this.isThinking = true;

        // Add thinking indicator
        this.addThinkingIndicator();

        try {
            const aiResponse = await this.sendToAPI([...this.messages]);
            this.messages.push({ role: "assistant", content: aiResponse });
        } catch (error) {
            this.messages.push({ role: "assistant", content: "Sorry, I encountered an error. Please try again." });
        } finally {
            this.isThinking = false;
            this.renderMessages();
        }
    }

    async sendToAPI(messages) {
        const response = await fetch("https://muhammadasif-tech.online/aichat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";

        if (reader) {
            let done = false;
            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                if (value) {
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                done = true;
                                break;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.response) {
                                    result += parsed.response;
                                }
                            } catch (e) {
                                // Ignore invalid JSON
                            }
                        }
                    }
                }
            }
        } else {
            result = await response.text();
        }

        return result;
    }

    addThinkingIndicator() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'chat-message assistant thinking';
        thinkingDiv.innerHTML = `
            <div class="thinking-indicator">
                <span>🤔</span>
                <span class="thinking-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                </span>
            </div>
            <div class="thinking-text">AI is thinking...</div>
        `;
        this.chatMessages.appendChild(thinkingDiv);
        this.scrollToBottom();
    }

    renderMessages() {
        this.chatMessages.innerHTML = '';
        this.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${message.role}`;
            messageDiv.textContent = message.content;
            this.chatMessages.appendChild(messageDiv);
        });
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});