'use strict';

/**
 * VandiVerse — AI Copilot Page
 */
pages['ai'] = (function () {
  let aiAvailable = null; // null = unknown, true = available, false = not configured

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isKeyUnavailableError(err) {
    if (!err || typeof err !== 'string') return false;
    const lower = err.toLowerCase();
    return lower.includes('not available') || lower.includes('not configured') || err.includes('GROQ_API_KEY');
  }

  function render() {
    const hasContext = Boolean(VV.trip.destinationName || VV.trip.originName);
    const originText = VV.trip.originName ? `${VV.trip.originName} ➔ ` : '';
    const destText = VV.trip.destinationName || 'Destination not set';
    const contextBadge = hasContext
      ? `<div class="chat-context-badge">📍 Trip Context: ${esc(originText + destText)}</div>`
      : '';

    return `
      <section class="ai-page animate-in">
        <div id="ai-status-area" aria-live="polite"></div>

        <div id="ai-chat-area" class="hidden">
          ${contextBadge}
          <div id="chat-messages" class="chat-container" role="log" aria-live="polite" aria-label="Conversation history">
            <div class="chat-message assistant">
              👋 Hi! I am your VandiVerse AI Copilot. Ask me about road trip safety tips, scenic stops, kid activities in the car, or packing suggestions!
            </div>
          </div>

          <div class="chat-input-row">
            <textarea
              id="chat-input"
              class="chat-input"
              placeholder="Ask a question about your trip..."
              rows="1"
              maxlength="1000"
              aria-label="Ask AI Copilot"
            ></textarea>
            <button
              type="button"
              id="chat-send-btn"
              class="btn btn-primary"
              aria-label="Send question"
            >
              <span>Send</span>
            </button>
          </div>

          <div class="chat-disclaimer">
            🤖 AI recommendations are general guidance. Always verify real-time road conditions, state regulations, and local safety closures.
          </div>
        </div>
      </section>
    `;
  }

  function showUnavailable(statusArea) {
    if (!statusArea) statusArea = document.getElementById('ai-status-area');
    const chatArea = document.getElementById('ai-chat-area');
    if (chatArea) chatArea.classList.add('hidden');

    if (statusArea) {
      statusArea.innerHTML = `
        <div class="ai-unavailable animate-in">
          <div class="ai-icon" aria-hidden="true">🤖</div>
          <h3>AI Assistant Not Configured</h3>
          <p>
            The intelligent travel assistant requires a free Groq API key to answer family road-trip questions.
          </p>
          <p>
            Please add <code>GROQ_API_KEY="gsk_..."</code> to your <code>.env</code> file in the project root and restart the backend server.
          </p>
          <div class="mt-3 mb-3">
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" class="btn btn-amber btn-sm">
              🔑 Get Free API Key at console.groq.com
            </a>
          </div>
          <p class="text-muted" style="font-size:0.76rem;">
            Note: All other features (Trip setup, Open-Meteo weather forecasts, and offline checklists) work completely without an API key!
          </p>
        </div>
      `;
    }
  }

  function showChat() {
    const statusArea = document.getElementById('ai-status-area');
    const chatArea = document.getElementById('ai-chat-area');
    if (statusArea) statusArea.innerHTML = '';
    if (chatArea) chatArea.classList.remove('hidden');

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    if (input) {
      // Auto-resize on input
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });

      // Enter without Shift -> send
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.onclick = sendMessage;
    }
  }

  async function checkAiAvailability() {
    const statusArea = document.getElementById('ai-status-area');

    if (aiAvailable === true) {
      showChat();
      return;
    }

    if (aiAvailable === false) {
      showUnavailable(statusArea);
      return;
    }

    if (statusArea) {
      statusArea.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Checking AI service status...</span>
        </div>
      `;
    }

    const { data, error } = await apiGet('/api/ai/status');

    if (error || !data || data.configured !== true) {
      aiAvailable = false;
      showUnavailable(statusArea);
    } else {
      aiAvailable = true;
      showChat();
    }
  }

  function appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    msgDiv.textContent = text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  function appendError(errorText) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const errDiv = document.createElement('div');
    errDiv.className = 'error-msg';
    errDiv.textContent = `Error: ${errorText}`;
    container.appendChild(errDiv);
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!input || !sendBtn) return;

    const question = input.value.trim();
    if (!question) return;

    appendMessage('user', question);
    input.value = '';
    input.style.height = 'auto';

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner spinner-sm"></span>';

    const context = {};
    if (VV.trip.originName) context.origin = VV.trip.originName;
    if (VV.trip.destinationName) context.destination = VV.trip.destinationName;
    if (VV.trip.departureDate) context.departure_date = VV.trip.departureDate;

    const { data, error } = await apiPost('/api/ask', {
      question,
      context,
    });

    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span>Send</span>';

    if (error) {
      if (isKeyUnavailableError(error)) {
        aiAvailable = false;
        showUnavailable(document.getElementById('ai-status-area'));
      } else {
        appendError(error);
      }
      return;
    }

    if (data && data.answer) {
      appendMessage('assistant', data.answer);

      // Display the deterministic safety gate and execution trace for transparency.
      if (data.safety_assessment) {
        const safety = data.safety_assessment;
        const traceLines = Array.isArray(data.agent_trace)
          ? data.agent_trace.map((step, index) =>
              `${index + 1}. ${step.stage}: ${step.status} — ${step.detail}`
            )
          : [];
        appendMessage(
          'assistant',
          `🛡️ VandiVerse Safety Gate: ${safety.title} (${String(safety.level).toUpperCase()})\n\n${safety.guidance}\n\nWhy: ${safety.reason}\n\nExecution trace:\n${traceLines.join('\n')}\n\nLive road data checked: ${safety.live_road_data_checked ? 'Yes' : 'No'}`
        );
      }
    } else {
      appendError('No response received from assistant.');
    }
  }

  function init() {
    checkAiAvailability();
  }

  return {
    render,
    init,
  };
})();
