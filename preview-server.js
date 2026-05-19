const http = require("http");

const port = Number(process.env.PORT || 5173);

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>鹿多多 AI 課程互動聊天室</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      font-family: "Noto Sans TC", "Microsoft JhengHei", Inter, system-ui, sans-serif;
      color: #0f172a;
      background: radial-gradient(circle at top left, #fff7ed 0, #fff 34%, #eaf3ff 100%);
    }
    button, input, textarea { font: inherit; }
    .join {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px;
    }
    .shell {
      width: min(1120px, 100%);
      display: grid;
      grid-template-columns: 1.05fr .95fr;
      gap: 44px;
      align-items: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      border-radius: 999px;
      color: #2563eb;
      font-weight: 800;
      background: white;
      box-shadow: 0 8px 20px rgb(37 99 235 / .08);
      border: 1px solid #dbeafe;
    }
    h1 {
      margin: 24px 0 16px;
      font-size: clamp(38px, 6vw, 66px);
      line-height: 1.08;
      letter-spacing: 0;
    }
    .lead {
      max-width: 660px;
      color: #475569;
      font-size: 18px;
      line-height: 1.85;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 34px;
      max-width: 660px;
    }
    .feature {
      border: 1px solid #fed7aa;
      background: rgb(255 255 255 / .86);
      border-radius: 8px;
      padding: 16px;
      font-weight: 900;
    }
    .bar {
      height: 6px;
      margin-top: 16px;
      border-radius: 999px;
      background: linear-gradient(90deg, #f97316, #2563eb);
    }
    .card {
      background: rgb(255 255 255 / .92);
      border: 1px solid white;
      border-radius: 28px;
      padding: 34px;
      box-shadow: 0 24px 70px rgb(15 23 42 / .13);
    }
    .icon {
      width: 56px;
      height: 56px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: #ffedd5;
      color: #f97316;
      font-size: 28px;
      margin-bottom: 24px;
    }
    .card h2 { margin: 0; font-size: 26px; }
    .hint { color: #64748b; line-height: 1.65; margin: 10px 0 24px; }
    label { display: block; font-weight: 900; color: #334155; margin-bottom: 8px; }
    input {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px;
      outline: none;
    }
    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 4px #dbeafe;
    }
    .primary {
      width: 100%;
      margin-top: 16px;
      border: 0;
      border-radius: 18px;
      padding: 16px;
      background: #2563eb;
      color: white;
      font-weight: 900;
      cursor: pointer;
    }
    .chat {
      display: none;
      min-height: 100vh;
      background: #f1f5f9;
      grid-template-columns: 320px 1fr;
      max-width: 1280px;
      margin: 0 auto;
    }
    aside {
      background: white;
      border-right: 1px solid #e2e8f0;
      padding: 22px;
    }
    .brandIcon {
      width: 50px;
      height: 50px;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: #ffedd5;
      color: #f97316;
      font-size: 26px;
    }
    aside h2 { margin: 14px 0 10px; font-size: 24px; line-height: 1.22; }
    aside p { color: #64748b; line-height: 1.65; }
    .sideGrid { display: grid; gap: 12px; margin-top: 20px; }
    .stat, .member {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px;
    }
    .stat small { color: #64748b; font-weight: 900; }
    .stat strong { display: block; margin-top: 8px; font-size: 34px; }
    .member { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
    .chatMain { display: flex; min-height: 100vh; flex-direction: column; }
    header, footer {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 18px 24px;
    }
    header strong { display: block; color: #f97316; font-size: 14px; }
    header h2 { margin: 4px 0 0; }
    .messages {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: auto;
    }
    .msg { display: flex; gap: 12px; max-width: 760px; }
    .avatar {
      flex: 0 0 auto;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: grid;
      place-items: center;
      font-weight: 900;
    }
    .bubble {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px 18px 18px 4px;
      padding: 12px 16px;
      line-height: 1.7;
      box-shadow: 0 2px 8px rgb(15 23 42 / .04);
    }
    .meta { color: #64748b; font-size: 12px; font-weight: 800; margin-bottom: 4px; }
    .typing { color: #64748b; font-weight: 800; font-size: 14px; }
    footer { border-top: 1px solid #e2e8f0; border-bottom: 0; }
    .emojis { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .emojis button, .attach, .send {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      height: 42px;
      min-width: 42px;
      cursor: pointer;
    }
    .composer { display: flex; gap: 10px; align-items: end; }
    textarea {
      min-height: 48px;
      flex: 1;
      resize: none;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      outline: none;
    }
    .send { background: #f97316; color: white; border: 0; padding: 0 18px; font-weight: 900; }
    .notice {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 8px;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 800;
      line-height: 1.6;
    }
    @media (max-width: 880px) {
      .shell { grid-template-columns: 1fr; }
      .features { grid-template-columns: 1fr; }
      .chat { grid-template-columns: 1fr; }
      aside { border-right: 0; border-bottom: 1px solid #e2e8f0; }
      .chatMain { min-height: 620px; }
    }
  </style>
</head>
<body>
  <main class="join" id="join">
    <section class="shell">
      <div>
        <div class="badge">💬 鹿多多課程研討會即時互動</div>
        <h1>鹿多多 AI 課程互動聊天室</h1>
        <p class="lead">為課程問答、分組討論與活動回饋打造的即時互動空間。輸入姓名後即可加入同一聊天室，支援文字、圖片、文字檔與快速表情回應。</p>
        <div class="features">
          <div class="feature">即時同步<div class="bar"></div></div>
          <div class="feature">課堂互動<div class="bar"></div></div>
          <div class="feature">附件分享<div class="bar"></div></div>
        </div>
      </div>
      <form class="card" id="joinForm">
        <div class="icon">↪</div>
        <h2>進入聊天室</h2>
        <p class="hint">請輸入姓名或暱稱，方便講師與同學辨識你的訊息。</p>
        <label for="name">姓名或暱稱</label>
        <input id="name" maxlength="24" placeholder="例如：鹿多多、小鹿老師" autofocus />
        <button class="primary" type="submit">加入 WaveRoom</button>
        <div class="notice">目前這是免 npm 預覽模式，用來先看 UI。完整多人即時聊天請安裝依賴後執行 npm run dev。</div>
      </form>
    </section>
  </main>
  <main class="chat" id="chat">
    <aside>
      <div class="brandIcon">💬</div>
      <h2>鹿多多 AI 課程互動聊天室</h2>
      <p>WaveRoom 即時互動空間，適合課堂提問、研討會討論與活動回饋。</p>
      <button class="primary" id="copy">複製連結</button>
      <div class="sideGrid">
        <div class="stat"><small>線上人數</small><strong>1</strong></div>
        <div class="stat"><small>目前名稱</small><strong id="currentName">訪客</strong></div>
      </div>
      <h3>在線成員</h3>
      <div class="member"><span class="dot"></span><span id="memberName">訪客</span></div>
    </aside>
    <section class="chatMain">
      <header><strong>WaveRoom</strong><h2>課程互動訊息區</h2></header>
      <div class="messages" id="messages">
        <div class="msg">
          <div class="avatar">鹿</div>
          <div>
            <div class="meta">小鹿老師 · 現在</div>
            <div class="bubble">歡迎加入鹿多多 AI 課程互動聊天室，這裡可以即時提問、分享附件與快速回應。</div>
          </div>
        </div>
        <div class="typing" id="typing"></div>
      </div>
      <footer>
        <div class="emojis">
          <button>👍</button><button>🙋</button><button>✨</button><button>😊</button><button>🔥</button><button>👏</button>
        </div>
        <form class="composer" id="sendForm">
          <button class="attach" type="button">📎</button>
          <textarea id="message" placeholder="輸入訊息、問題或活動回饋..."></textarea>
          <button class="send" type="submit">送出</button>
        </form>
      </footer>
    </section>
  </main>
  <script>
    const join = document.getElementById("join");
    const chat = document.getElementById("chat");
    const nameInput = document.getElementById("name");
    const currentName = document.getElementById("currentName");
    const memberName = document.getElementById("memberName");
    const messages = document.getElementById("messages");
    const message = document.getElementById("message");
    const typing = document.getElementById("typing");
    document.getElementById("joinForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = nameInput.value.trim() || "訪客";
      currentName.textContent = name;
      memberName.textContent = name;
      join.style.display = "none";
      chat.style.display = "grid";
    });
    document.getElementById("sendForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const text = message.value.trim();
      if (!text) return;
      const wrap = document.createElement("div");
      wrap.className = "msg";
      wrap.innerHTML = '<div class="avatar">' + currentName.textContent.slice(0, 1) + '</div><div><div class="meta">' + currentName.textContent + ' · 現在</div><div class="bubble"></div></div>';
      wrap.querySelector(".bubble").textContent = text;
      messages.insertBefore(wrap, typing);
      message.value = "";
      typing.textContent = "";
      wrap.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    message.addEventListener("input", () => {
      typing.textContent = message.value.trim() ? currentName.textContent + " 正在輸入中..." : "";
    });
    document.querySelectorAll(".emojis button").forEach((button) => {
      button.addEventListener("click", () => {
        message.value = (message.value + " " + button.textContent).trim();
        typing.textContent = currentName.textContent + " 正在輸入中...";
        message.focus();
      });
    });
    document.getElementById("copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText(location.href);
      document.getElementById("copy").textContent = "已複製";
      setTimeout(() => document.getElementById("copy").textContent = "複製連結", 1400);
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
});

server.listen(port, () => {
  console.log(`Preview running at http://localhost:${port}`);
});
