(function() {
  'use strict';

  const chatbotId = document.currentScript.getAttribute('data-chatbot-id');
  const apiUrl = document.currentScript.getAttribute('data-api-url') || 'https://powerapp.api.rynebenson.com';

  if (!chatbotId) {
    console.error('PowerApp Widget: data-chatbot-id is required');
    return;
  }

  let isOpen = false;
  let messages = [];
  let sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  const styles = `
    .powerapp-widget-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .powerapp-widget-button:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
    }
    .powerapp-widget-button svg {
      width: 32px;
      height: 32px;
      fill: white;
      transition: transform 0.3s;
    }
    .powerapp-widget-button.open svg {
      transform: rotate(180deg);
    }
    .powerapp-widget-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 400px;
      height: 650px;
      max-height: calc(100vh - 130px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: none;
      flex-direction: column;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .powerapp-widget-container.open {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .powerapp-widget-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 16px 16px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .powerapp-widget-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 17px;
    }
    .powerapp-widget-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }
    .powerapp-widget-avatar svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    .powerapp-widget-close {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 18px;
    }
    .powerapp-widget-close:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: rotate(90deg);
    }
    .powerapp-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #fafafa;
    }
    .powerapp-widget-messages::-webkit-scrollbar {
      width: 6px;
    }
    .powerapp-widget-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .powerapp-widget-messages::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    .powerapp-widget-messages::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    .powerapp-widget-message {
      display: flex;
      max-width: 80%;
    }
    .powerapp-widget-message.user {
      align-self: flex-end;
      margin-left: auto;
    }
    .powerapp-widget-message.assistant {
      align-self: flex-start;
    }
    .powerapp-widget-message-content {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .powerapp-widget-message.user .powerapp-widget-message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .powerapp-widget-message.assistant .powerapp-widget-message-content {
      background: white;
      color: #1f2937;
      border-bottom-left-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .powerapp-widget-input-container {
      padding: 16px 20px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 10px;
      background: white;
    }
    .powerapp-widget-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
      background: #f9fafb;
      color: #1f2937;
    }
    .powerapp-widget-input:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .powerapp-widget-input::placeholder {
      color: #9ca3af;
    }
    .powerapp-widget-send {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
    .powerapp-widget-send:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .powerapp-widget-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .powerapp-widget-send svg {
      width: 18px;
      height: 18px;
      fill: white;
    }
    .powerapp-widget-empty {
      text-align: center;
      color: #9ca3af;
      padding: 60px 20px;
    }
    .powerapp-widget-empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.9;
    }
    .powerapp-widget-empty-icon svg {
      width: 32px;
      height: 32px;
      fill: white;
    }
    .powerapp-widget-loading {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
    }
    .powerapp-widget-loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: powerapp-bounce 1.4s infinite ease-in-out both;
    }
    .powerapp-widget-loading-dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .powerapp-widget-loading-dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes powerapp-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    @media (max-width: 480px) {
      .powerapp-widget-container {
        width: calc(100vw - 32px);
        height: calc(100vh - 110px);
        right: 16px;
        bottom: 90px;
      }
      .powerapp-widget-button {
        right: 16px;
        bottom: 16px;
      }
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  const container = document.createElement('div');
  container.className = 'powerapp-widget-container';
  container.innerHTML = `
    <div class="powerapp-widget-header">
      <div class="powerapp-widget-header-title">
        <div class="powerapp-widget-avatar">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 600;">Chat Support</div>
          <div style="font-size: 12px; opacity: 0.9;">We're here to help</div>
        </div>
      </div>
      <button class="powerapp-widget-close">✕</button>
    </div>
    <div class="powerapp-widget-messages" id="powerapp-messages">
      <div class="powerapp-widget-empty">
        <div class="powerapp-widget-empty-icon">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </div>
        <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Welcome!</div>
        <div style="font-size: 13px;">Ask me anything to get started</div>
      </div>
    </div>
    <div class="powerapp-widget-input-container">
      <input type="text" class="powerapp-widget-input" placeholder="Type your message..." id="powerapp-input" />
      <button class="powerapp-widget-send" id="powerapp-send">
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  `;

  const button = document.createElement('button');
  button.className = 'powerapp-widget-button';
  button.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `;

  document.body.appendChild(container);
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    container.classList.toggle('open', isOpen);
    button.classList.toggle('open', isOpen);
    if (isOpen) {
      document.getElementById('powerapp-input').focus();
    }
  });

  container.querySelector('.powerapp-widget-close').addEventListener('click', () => {
    isOpen = false;
    container.classList.remove('open');
    button.classList.remove('open');
  });

  function renderMessages() {
    const messagesContainer = document.getElementById('powerapp-messages');
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="powerapp-widget-empty">
          <div class="powerapp-widget-empty-icon">
            <svg viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Welcome!</div>
          <div style="font-size: 13px;">Ask me anything to get started</div>
        </div>
      `;
    } else {
      messagesContainer.innerHTML = messages.map(msg => `
        <div class="powerapp-widget-message ${msg.role}">
          <div class="powerapp-widget-message-content">${escapeHtml(msg.content)}</div>
        </div>
      `).join('');
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  function showLoading() {
    const messagesContainer = document.getElementById('powerapp-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'powerapp-widget-message assistant';
    loadingDiv.innerHTML = `
      <div class="powerapp-widget-loading">
        <div class="powerapp-widget-loading-dot"></div>
        <div class="powerapp-widget-loading-dot"></div>
        <div class="powerapp-widget-loading-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return loadingDiv;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    messages.push({ role: 'user', content: text });
    renderMessages();

    const input = document.getElementById('powerapp-input');
    const sendBtn = document.getElementById('powerapp-send');
    input.disabled = true;
    sendBtn.disabled = true;

    const loadingDiv = showLoading();

    try {
      const response = await fetch(`${apiUrl}/chat/${chatbotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });

      loadingDiv.remove();

      if (response.ok) {
        const data = await response.json();
        messages.push({ role: 'assistant', content: data.response });
      } else {
        messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
      }
    } catch (error) {
      loadingDiv.remove();
      messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
    }

    renderMessages();
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  document.getElementById('powerapp-send').addEventListener('click', () => {
    const input = document.getElementById('powerapp-input');
    sendMessage(input.value);
    input.value = '';
  });

  document.getElementById('powerapp-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const input = document.getElementById('powerapp-input');
      sendMessage(input.value);
      input.value = '';
    }
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
