# 鹿多多 AI 課程互動聊天室

一個類似 WaveRoom 的即時互動聊天室，適合課程、研討會與活動現場討論使用。前端使用 React + Tailwind CSS，後端使用 Node.js + Express，Socket.IO 負責多人即時同步，multer 處理圖片與文字檔上傳。

## 功能

- 進入聊天室前需輸入姓名或暱稱
- 顯示聊天室名稱、說明、線上人數與在線成員
- 多人即時聊天與訊息同步
- 支援圖片與文字檔附件上傳，單檔上限 3MB
- 顯示「某某正在輸入中」狀態
- 可更換名稱
- 可複製聊天室連結
- 快速表情按鈕
- 橘色、藍色、白色現代簡潔 UI
- RWD 響應式設計，支援手機與電腦

## 專案結構

```txt
wave-room-chat/
├─ package.json
├─ .env.example
├─ server/
│  ├─ index.js
│  └─ uploads/
│     └─ .gitkeep
└─ client/
   ├─ package.json
   ├─ index.html
   ├─ vite.config.js
   ├─ postcss.config.js
   ├─ tailwind.config.js
   └─ src/
      ├─ main.jsx
      └─ styles.css
```

## 本機執行

1. 安裝依賴

```bash
npm install
```

2. 複製環境變數

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

3. 啟動開發環境

```bash
npm run dev
```

4. 開啟瀏覽器

```txt
http://localhost:5173
```

後端預設執行於：

```txt
http://localhost:3001
```

## 可用指令

```bash
npm run dev
```

同時啟動 Express 後端與 Vite 前端。

```bash
npm run build
```

建置 React 前端到 `client/dist`。

```bash
npm start
```

以 production 模式啟動 Express，並服務 `client/dist` 靜態檔案。

## 部署到 Render

### 方法一：使用 Render Blueprint

專案已包含 `render.yaml`，可以用 Render 的 Blueprint 方式部署。

1. 將專案推到 GitHub。
2. 到 Render Dashboard 選擇 New > Blueprint。
3. 連接 GitHub repository。
4. Render 會讀取 `render.yaml`，自動建立 Web Service。
5. 部署完成後，使用 Render 提供的 `onrender.com` 網址進入聊天室。

### 方法二：手動建立 Web Service

1. 將專案推到 GitHub。

2. 到 Render 建立新的 Web Service。

3. 選擇你的 GitHub repository。

4. 設定：

```txt
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
```

5. Environment Variables 建議設定：

```txt
NODE_ENV=production
```

Render 會自動提供 `PORT`，不需要手動設定。

6. 部署完成後，使用 Render 提供的公開網址進入聊天室。多人開啟同一網址即可同步聊天。

## 注意事項

- 訊息與在線狀態暫存在伺服器記憶體，伺服器重啟後會清空。
- 上傳檔案儲存在 `server/uploads`，正式營運若需要長期保存，建議改接雲端儲存服務。
- 目前允許的附件類型包含 JPEG、PNG、GIF、WebP、TXT、Markdown、JSON。
