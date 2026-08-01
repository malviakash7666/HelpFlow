(function () {
  // 1. Grab configuration from the script tag
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  if (!scriptTag) {
    console.error("[OmniSupport] Integration script tag not found.");
    return;
  }

  const companyId = scriptTag.getAttribute("data-company-id") || scriptTag.getAttribute("data-bot-id");
  const botId = scriptTag.getAttribute("data-bot-id") || companyId;
  const widgetKey = scriptTag.getAttribute("data-widget-key") || scriptTag.getAttribute("data-public-key");

  if (!companyId || !widgetKey) {
    console.error("[OmniSupport] Missing data-bot-id / data-company-id or data-public-key / data-widget-key.");
    return;
  }

  // Auto-detect the backend base URL from the script source
  const scriptSrc = scriptTag.getAttribute("src");
  let apiBaseUrl = "http://localhost:5000";
  try {
    const urlObj = new URL(scriptSrc, window.location.origin);
    apiBaseUrl = urlObj.origin;
  } catch (e) {
    console.warn("[OmniSupport] Could not resolve script origin, defaulting to localhost:5000");
  }

  // 2. Inject Google Fonts
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(fontLink);

  // 3. Inject CSS Styles
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    .omni-chat-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .omni-chat-btn {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      outline: none;
    }
    .omni-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
    }
    .omni-chat-btn:active {
      transform: scale(0.95);
    }
    .omni-chat-btn svg {
      width: 28px;
      height: 28px;
      color: #ffffff;
      transition: transform 0.3s ease;
    }
    .omni-chat-btn.open svg {
      transform: rotate(90deg);
    }
    .omni-chat-window {
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .omni-chat-window.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .omni-chat-header {
      background: #1e293b;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #334155;
    }
    .omni-chat-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .omni-chat-logo svg {
      width: 18px;
      height: 18px;
      color: #ffffff;
    }
    .omni-chat-title-container {
      flex-grow: 1;
    }
    .omni-chat-title {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }
    .omni-chat-status {
      font-size: 10px;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .omni-chat-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    .omni-chat-messages {
      flex-grow: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #090d16;
    }
    .omni-msg {
      max-width: 80%;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.25s ease forwards;
    }
    .omni-msg.visitor {
      align-self: flex-end;
    }
    .omni-msg.bot {
      align-self: flex-start;
    }
    .omni-msg-bubble {
      padding: 10px 14px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .omni-msg.visitor .omni-msg-bubble {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
      border-radius: 14px 14px 0 14px;
    }
    .omni-msg.bot .omni-msg-bubble {
      background: rgba(99, 102, 241, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 14px 14px 14px 0;
    }
    .omni-msg-time {
      font-size: 8.5px;
      color: #475569;
    }
    .omni-msg.visitor .omni-msg-time {
      text-align: right;
    }
    .omni-msg.bot .omni-msg-time {
      text-align: left;
    }
    .omni-chat-input-area {
      padding: 12px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      display: flex;
      gap: 8px;
    }
    .omni-chat-input {
      flex-grow: 1;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 12px;
      color: #f8fafc;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .omni-chat-input::placeholder {
      color: #64748b;
    }
    .omni-chat-input:focus {
      border-color: #6366f1;
    }
    .omni-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #6366f1;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }
    .omni-send-btn:hover {
      background: #4f46e5;
    }
    .omni-send-btn svg {
      width: 16px;
      height: 16px;
      color: #ffffff;
    }
    .omni-typing-loader {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 14px 14px 14px 0;
      align-self: flex-start;
      margin-top: 4px;
    }
    .omni-dot {
      width: 6px;
      height: 6px;
      background: #6366f1;
      border-radius: 3px;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .omni-dot:nth-child(1) { animation-delay: -0.32s; }
    .omni-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.6; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
      .omni-chat-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: 16px;
      }
      .omni-chat-widget {
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(styleTag);

  // 4. Build Widget DOM
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "omni-chat-widget";

  // Create Chat Window
  const chatWindow = document.createElement("div");
  chatWindow.className = "omni-chat-window";

  // Header
  const chatHeader = document.createElement("div");
  chatHeader.className = "omni-chat-header";
  chatHeader.innerHTML = `
    <div class="omni-chat-logo">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div class="omni-chat-title-container">
      <h4 class="omni-chat-title">AI Support Assistant</h4>
      <div class="omni-chat-status">
        <div class="omni-chat-status-dot"></div>
        <span>AI Online</span>
      </div>
    </div>
  `;
  chatWindow.appendChild(chatHeader);

  // Messages Scroll View
  const chatMessages = document.createElement("div");
  chatMessages.className = "omni-chat-messages";
  chatWindow.appendChild(chatMessages);

  // Input Box Area
  const inputArea = document.createElement("div");
  inputArea.className = "omni-chat-input-area";

  const chatInput = document.createElement("input");
  chatInput.className = "omni-chat-input";
  chatInput.type = "text";
  chatInput.placeholder = "Ask a question...";
  inputArea.appendChild(chatInput);

  const sendBtn = document.createElement("button");
  sendBtn.className = "omni-send-btn";
  sendBtn.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  `;
  inputArea.appendChild(sendBtn);
  chatWindow.appendChild(inputArea);

  widgetContainer.appendChild(chatWindow);

  // Create FAB Button
  const chatBtn = document.createElement("button");
  chatBtn.className = "omni-chat-btn";
  chatBtn.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" id="omni-icon-bubble">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" id="omni-icon-close" style="display:none;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;
  widgetContainer.appendChild(chatBtn);

  if (document.body) {
    document.body.appendChild(widgetContainer);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(widgetContainer);
    });
  }

  // 5. Setup Messaging State & Cache
  let isOpen = false;
  let messagesList = [];

  // Restore session history if present
  const sessionKey = `omni_conv_${companyId}`;
  const historyKey = `omni_history_${companyId}`;
  
  let conversationId = sessionStorage.getItem(sessionKey) || null;
  const cachedHistory = sessionStorage.getItem(historyKey);
  if (cachedHistory) {
    try {
      messagesList = JSON.parse(cachedHistory);
    } catch(e) {
      messagesList = [];
    }
  }

  // If empty log, add a welcoming message
  if (messagesList.length === 0) {
    messagesList.push({
      id: "welcome",
      senderType: "bot",
      content: "Hello! I am your AI Support Assistant. Ask me anything about our services!",
      createdAt: new Date().toISOString()
    });
  }

  // Render messages
  const renderMessages = () => {
    chatMessages.innerHTML = "";
    messagesList.forEach(msg => {
      const msgDiv = document.createElement("div");
      msgDiv.className = `omni-msg ${msg.senderType}`;
      
      const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      msgDiv.innerHTML = `
        <div class="omni-msg-bubble">${msg.content}</div>
        <div class="omni-msg-time">${timeFormatted}</div>
      `;
      chatMessages.appendChild(msgDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  renderMessages();

  // Toggle Visibility
  const toggleChat = () => {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.add("show");
      chatBtn.classList.add("open");
      document.getElementById("omni-icon-bubble").style.display = "none";
      document.getElementById("omni-icon-close").style.display = "block";
      setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 100);
    } else {
      chatWindow.classList.remove("show");
      chatBtn.classList.remove("open");
      document.getElementById("omni-icon-bubble").style.display = "block";
      document.getElementById("omni-icon-close").style.display = "none";
    }
  };

  chatBtn.addEventListener("click", toggleChat);

  // Message Sender
  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";

    // Append visitor message
    const visitorMsg = {
      id: "v_" + Date.now(),
      senderType: "visitor",
      content: text,
      createdAt: new Date().toISOString()
    };
    messagesList.push(visitorMsg);
    renderMessages();

    // Show Typing Indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "omni-typing-loader";
    typingIndicator.innerHTML = `
      <div class="omni-dot"></div>
      <div class="omni-dot"></div>
      <div class="omni-dot"></div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch(`${apiBaseUrl}/api/widget/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          widgetKey,
          message: text,
          conversationId
        })
      });

      const result = await response.json();
      
      // Remove Typing Indicator
      typingIndicator.remove();

      if (result.success && result.data) {
        const botMsg = {
          id: "b_" + Date.now(),
          senderType: "bot",
          content: result.data.answer,
          createdAt: new Date().toISOString()
        };
        messagesList.push(botMsg);
        
        // Cache conversation details
        if (result.data.conversationId) {
          conversationId = result.data.conversationId;
          sessionStorage.setItem(sessionKey, conversationId);
        }
        
        sessionStorage.setItem(historyKey, JSON.stringify(messagesList));
        renderMessages();
      } else {
        throw new Error(result.message || "Failed to generate AI response.");
      }
    } catch (error) {
      typingIndicator.remove();
      const errMsg = {
        id: "err_" + Date.now(),
        senderType: "bot",
        content: `Error: ${error.message || "Failed to reach server. Please check your connection."}`,
        createdAt: new Date().toISOString()
      };
      messagesList.push(errMsg);
      renderMessages();
    }
  };

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

})();
