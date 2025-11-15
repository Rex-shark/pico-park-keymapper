import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="host">
    <h1>Pico Park Keymapper 主控台</h1>
    <section class="controls">
      <label>
        房間 ID：
        <input id="roomId" value="testroom" />
      </label>
      <button id="startBtn">開始 (成為主持人)</button>
      <span id="connStatus" class="status">尚未連線</span>
    </section>
    <section class="chat">
      <h2>聊天室</h2>
      <div id="chatWindow" class="chat-window"></div>
      <div class="chat-input">
        <input id="chatInput" placeholder="輸入訊息 (選填，純顯示用)" />
        <button id="sendChatBtn">送出</button>
      </div>
    </section>
    <section class="links">
      <p>手機手把頁面：</p>
      <ul>
        <li><a href="/user1.html" target="_blank">玩家1 手把</a></li>
        <li><a href="/user2.html" target="_blank">玩家2 手把</a></li>
      </ul>
    </section>
  </main>
`;

let ws = null;

const roomIdInput = document.getElementById('roomId');
const startBtn = document.getElementById('startBtn');
const connStatus = document.getElementById('connStatus');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

function appendMessage(text) {
  const line = document.createElement('div');
  line.textContent = text;
  chatWindow.appendChild(line);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function connect() {
  const roomId = roomIdInput.value.trim();
  if (!roomId) {
    alert('請輸入房間 ID');
    return;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }

  const url = `ws://localhost:5174/socket?roomId=${encodeURIComponent(roomId)}&role=host`;
  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    connStatus.textContent = `已連線到房間 ${roomId}`;
    appendMessage(`[系統] 已成為房間 ${roomId} 的主持人`);
  });

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'system' || msg.type === 'chat') {
        appendMessage(msg.message || msg.text || JSON.stringify(msg));
      } else {
        appendMessage(JSON.stringify(msg));
      }
    } catch (e) {
      appendMessage(event.data);
    }
  });

  ws.addEventListener('close', () => {
    connStatus.textContent = '連線中斷';
    appendMessage('[系統] WebSocket 已關閉');
  });

  ws.addEventListener('error', () => {
    connStatus.textContent = '連線錯誤';
    appendMessage('[系統] WebSocket 發生錯誤');
  });
}

startBtn.addEventListener('click', () => {
  connect();
});

sendChatBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: 'chat', text }));
  chatInput.value = '';
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendChatBtn.click();
  }
});
