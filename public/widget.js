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
  let activeTab = 'home';

  const styles = `
    .powerapp-widget-button {\n      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(147, 51, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .powerapp-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(147, 51, 234, 0.5);
    }
    .powerapp-widget-button svg {
      width: 32px;
      height: 32px;
      fill: white;
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
      overflow: hidden;
    }
    .powerapp-widget-container.open {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .powerapp-widget-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .powerapp-widget-header-title {
      flex: 1;
      text-align: center;
      font-weight: 600;
      font-size: 18px;
      color: #111827;
    }
    .powerapp-widget-close {
      background: transparent;
      border: none;
      color: #64748b;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .powerapp-widget-close:hover {
      background: #f1f5f9;
    }
    .powerapp-widget-close svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      stroke-width: 2;
    }
    .powerapp-widget-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .powerapp-widget-tab {
      display: none;
      flex: 1;
      flex-direction: column;
    }
    .powerapp-widget-tab.active {
      display: flex;
    }
    .powerapp-widget-nav {
      display: flex;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    .powerapp-widget-nav-item {
      flex: 1;
      padding: 16px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #6b7280;
      transition: all 0.2s;
    }
    .powerapp-widget-nav-item:hover {
      background: #f9fafb;
    }
    .powerapp-widget-nav-item.active {
      color: #6366f1;
    }
    .powerapp-widget-nav-item svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
    }
    .powerapp-widget-nav-item span {
      font-size: 12px;
      font-weight: 500;
    }
    .powerapp-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: white;
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
      background: linear-gradient(135deg, #6366f1 0%, #9333ea 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .powerapp-widget-message.assistant .powerapp-widget-message-content {
      background: #f9fafb;
      color: #111827;
      border-bottom-left-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .powerapp-widget-input-container {
      padding: 20px;
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
      color: #111827;
    }
    .powerapp-widget-input:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .powerapp-widget-input::placeholder {
      color: #9ca3af;
    }
    .powerapp-widget-send {
      background: linear-gradient(135deg, #6366f1 0%, #9333ea 100%);
      color: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    .powerapp-widget-send:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
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
      background: linear-gradient(135deg, #6366f1 0%, #9333ea 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
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

  function updateHeaderTitle() {
    const titleEl = container.querySelector('.powerapp-widget-header-title');
    const titles = {
      home: 'Chat Support',
      messages: 'Messages',
      help: 'Help',
      news: 'News'
    };
    titleEl.textContent = titles[activeTab];
  }

  const container = document.createElement('div');
  container.className = 'powerapp-widget-container';
  container.innerHTML = `
    <div class="powerapp-widget-header">
      <div class="powerapp-widget-header-title">Chat Support</div>
      <button class="powerapp-widget-close">
        <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="powerapp-widget-content">
      <div class="powerapp-widget-tab active" data-tab-content="home">
        <div class="powerapp-widget-messages">
          <div class="powerapp-widget-empty">
            <div class="powerapp-widget-empty-icon">
              <svg viewBox="0 0 256 256"><path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-88,0H104V160a4,4,0,0,1,4-4h40a4,4,0,0,1,4,4Z"/></svg>
            </div>
            <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Welcome Home!</div>
            <div style="font-size: 13px;">Your dashboard overview</div>
          </div>
        </div>
      </div>
      <div class="powerapp-widget-tab" data-tab-content="messages">
        <div class="powerapp-widget-messages" id="powerapp-messages">
          <div class="powerapp-widget-empty">
            <div class="powerapp-widget-empty-icon">
              <svg viewBox="0 0 256 256"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z"/></svg>
            </div>
            <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Welcome!</div>
            <div style="font-size: 13px;">Ask me anything to get started</div>
          </div>
        </div>
        <div class="powerapp-widget-input-container">
          <input type="text" class="powerapp-widget-input" placeholder="Type your message..." id="powerapp-input" />
          <button class="powerapp-widget-send" id="powerapp-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <div class="powerapp-widget-tab" data-tab-content="help">
        <div class="powerapp-widget-messages">
          <div class="powerapp-widget-empty">
            <div class="powerapp-widget-empty-icon">
              <svg viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,168a12,12,0,1,1,12-12A12,12,0,0,1,128,192Zm8-48.72V144a8,8,0,0,1-16,0v-8a8,8,0,0,1,8-8c13.23,0,24-9,24-20s-10.77-20-24-20-24,9-24,20v4a8,8,0,0,1-16,0v-4c0-19.85,17.94-36,40-36s40,16.15,40,36C168,125.38,154.24,139.93,136,143.28Z"/></svg>
            </div>
            <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Help Center</div>
            <div style="font-size: 13px;">Find answers to common questions</div>
          </div>
        </div>
      </div>
      <div class="powerapp-widget-tab" data-tab-content="news">
        <div class="powerapp-widget-messages">
          <div class="powerapp-widget-empty">
            <div class="powerapp-widget-empty-icon">
              <svg viewBox="0 0 256 256"><path d="M200,72H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48,48,0,0,0,200,72ZM179,207.89l0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z"/></svg>
            </div>
            <div style="font-size: 15px; font-weight: 500; color: #4b5563; margin-bottom: 4px;">Latest News</div>
            <div style="font-size: 13px;">Stay updated with announcements</div>
          </div>
        </div>
      </div>
    </div>
    <div class="powerapp-widget-nav">
      <button class="powerapp-widget-nav-item active" data-tab="home">
        <svg viewBox="0 0 256 256"><path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-88,0H104V160a4,4,0,0,1,4-4h40a4,4,0,0,1,4,4Z"/></svg>
        <span>Home</span>
      </button>
      <button class="powerapp-widget-nav-item" data-tab="messages">
        <svg viewBox="0 0 256 256"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"/></svg>
        <span>Messages</span>
      </button>
      <button class="powerapp-widget-nav-item" data-tab="help">
        <svg viewBox="0 0 256 256"><path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
        <span>Help</span>
      </button>
      <button class="powerapp-widget-nav-item" data-tab="news">
        <svg viewBox="0 0 256 256"><path d="M248,120a48.05,48.05,0,0,0-48-48H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48.07,48.07,0,0,0,248,120ZM48,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C134.65,155,90.84,164.07,48,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z"/></svg>
        <span>News</span>
      </button>
    </div>
  `;

  const button = document.createElement('button');
  button.className = 'powerapp-widget-button';
  button.innerHTML = `
    <svg viewBox="0 0 256 256"><path d="M232,128v80a40,40,0,0,1-40,40H136a8,8,0,0,1,0-16h56a24,24,0,0,0,24-24H192a24,24,0,0,1-24-24V144a24,24,0,0,1,24-24h23.65A88,88,0,0,0,66,65.54,87.29,87.29,0,0,0,40.36,120H64a24,24,0,0,1,24,24v40a24,24,0,0,1-24,24H48a24,24,0,0,1-24-24V128A104.11,104.11,0,0,1,201.89,54.66,103.41,103.41,0,0,1,232,128Z"/></svg>
  `;

  document.body.appendChild(container);
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    container.classList.toggle('open', isOpen);
    if (isOpen && activeTab === 'messages') {
      document.getElementById('powerapp-input').focus();
    }
  });

  const navIcons = {
    home: {
      regular: '<svg viewBox="0 0 256 256"><path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z"/></svg>',
      filled: '<svg viewBox="0 0 256 256"><path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-88,0H104V160a4,4,0,0,1,4-4h40a4,4,0,0,1,4,4Z"/></svg>'
    },
    messages: {
      regular: '<svg viewBox="0 0 256 256"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"/></svg>',
      filled: '<svg viewBox="0 0 256 256"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z"/></svg>'
    },
    help: {
      regular: '<svg viewBox="0 0 256 256"><path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>',
      filled: '<svg viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,168a12,12,0,1,1,12-12A12,12,0,0,1,128,192Zm8-48.72V144a8,8,0,0,1-16,0v-8a8,8,0,0,1,8-8c13.23,0,24-9,24-20s-10.77-20-24-20-24,9-24,20v4a8,8,0,0,1-16,0v-4c0-19.85,17.94-36,40-36s40,16.15,40,36C168,125.38,154.24,139.93,136,143.28Z"/></svg>'
    },
    news: {
      regular: '<svg viewBox="0 0 256 256"><path d="M248,120a48.05,48.05,0,0,0-48-48H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48.07,48.07,0,0,0,248,120ZM48,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C134.65,155,90.84,164.07,48,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z"/></svg>',
      filled: '<svg viewBox="0 0 256 256"><path d="M200,72H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48,48,0,0,0,200,72ZM179,207.89l0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z"/></svg>'
    }
  };

  function updateNavIcons() {
    container.querySelectorAll('.powerapp-widget-nav-item').forEach(item => {
      const tab = item.getAttribute('data-tab');
      const isActive = item.classList.contains('active');
      const iconHTML = isActive ? navIcons[tab].filled : navIcons[tab].regular;
      const span = item.querySelector('span');
      item.innerHTML = iconHTML + '<span>' + span.textContent + '</span>';
    });
  }

  container.querySelectorAll('.powerapp-widget-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      activeTab = tab;
      
      container.querySelectorAll('.powerapp-widget-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      container.querySelectorAll('.powerapp-widget-tab').forEach(t => t.classList.remove('active'));
      container.querySelector(`[data-tab-content="${tab}"]`).classList.add('active');
      
      updateHeaderTitle();
      updateNavIcons();
      
      if (tab === 'messages') {
        document.getElementById('powerapp-input').focus();
      }
    });
  });

  container.querySelector('.powerapp-widget-close').addEventListener('click', () => {
    isOpen = false;
    container.classList.remove('open');
  });

  function renderMessages() {
    const messagesContainer = document.getElementById('powerapp-messages');
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="powerapp-widget-empty">
          <div class="powerapp-widget-empty-icon">
            <svg viewBox="0 0 256 256"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24ZM84,140a12,12,0,1,1,12-12A12,12,0,0,1,84,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,128,140Zm44,0a12,12,0,1,1,12-12A12,12,0,0,1,172,140Z"/></svg>
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
