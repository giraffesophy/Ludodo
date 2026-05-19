const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
const uploadsDir = path.join(__dirname, "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(
  cors({
    origin: isProduction ? undefined : CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const io = new Server(server, {
  cors: {
    origin: isProduction ? undefined : CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

const messages = [];
const users = new Map();
const typingUsers = new Map();
const MAX_MESSAGES = 120;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/json"
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^\w.-]+/g, "-")
      .slice(0, 60);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("只支援圖片與文字檔，上限 3MB。"));
  }
});

function publicUsers() {
  return Array.from(users.values()).map(({ id, name, color }) => ({ id, name, color }));
}

function emitRoomState() {
  io.emit("room:state", {
    onlineCount: users.size,
    users: publicUsers()
  });
}

function emitTyping() {
  io.emit("typing:update", Array.from(typingUsers.values()));
}

function makeMessage(payload) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...payload
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, room: "鹿多多 AI 課程互動聊天室" });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "請選擇要上傳的檔案。" });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    file: {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl
    }
  });
});

app.use((err, _req, res, next) => {
  if (!err) {
    next();
    return;
  }
  const message =
    err.code === "LIMIT_FILE_SIZE" ? "單檔大小不可超過 3MB。" : err.message || "上傳失敗。";
  res.status(400).json({ error: message });
});

io.on("connection", (socket) => {
  socket.emit("messages:history", messages);

  socket.on("user:join", (rawName, callback) => {
    const name = String(rawName || "").trim().slice(0, 24);
    if (!name) {
      callback?.({ ok: false, error: "請輸入姓名或暱稱。" });
      return;
    }

    const user = {
      id: socket.id,
      name,
      color: `hsl(${Math.floor(Math.random() * 360)} 78% 46%)`
    };
    users.set(socket.id, user);

    messages.push(
      makeMessage({
        type: "system",
        text: `${name} 加入聊天室`
      })
    );
    while (messages.length > MAX_MESSAGES) messages.shift();

    io.emit("messages:history", messages);
    emitRoomState();
    callback?.({
      ok: true,
      user,
      messages,
      roomState: {
        onlineCount: users.size,
        users: publicUsers()
      }
    });
  });

  socket.on("message:send", (payload, callback) => {
    const user = users.get(socket.id);
    if (!user) {
      callback?.({ ok: false, error: "尚未加入聊天室。" });
      return;
    }

    const text = String(payload?.text || "").trim().slice(0, 1200);
    const attachment = payload?.attachment || null;
    if (!text && !attachment) {
      callback?.({ ok: false, error: "訊息不可為空。" });
      return;
    }

    const message = makeMessage({
      type: "message",
      text,
      attachment,
      user
    });

    messages.push(message);
    while (messages.length > MAX_MESSAGES) messages.shift();
    typingUsers.delete(socket.id);

    io.emit("message:new", message);
    emitTyping();
    callback?.({ ok: true });
  });

  socket.on("user:rename", (rawName, callback) => {
    const current = users.get(socket.id);
    const name = String(rawName || "").trim().slice(0, 24);
    if (!current || !name) {
      callback?.({ ok: false, error: "名稱不可空白。" });
      return;
    }

    const previousName = current.name;
    current.name = name;
    users.set(socket.id, current);

    const message = makeMessage({
      type: "system",
      text: `${previousName} 改名為 ${name}`
    });
    messages.push(message);
    while (messages.length > MAX_MESSAGES) messages.shift();

    io.emit("messages:history", messages);
    emitRoomState();
    callback?.({ ok: true, user: current });
  });

  socket.on("typing:start", () => {
    const user = users.get(socket.id);
    if (!user) return;
    typingUsers.set(socket.id, { id: user.id, name: user.name });
    emitTyping();
  });

  socket.on("typing:stop", () => {
    typingUsers.delete(socket.id);
    emitTyping();
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    users.delete(socket.id);
    typingUsers.delete(socket.id);

    if (user) {
      messages.push(
        makeMessage({
          type: "system",
          text: `${user.name} 離開聊天室`
        })
      );
      while (messages.length > MAX_MESSAGES) messages.shift();
      io.emit("messages:history", messages);
    }

    emitRoomState();
    emitTyping();
  });
});

if (isProduction) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`WaveRoom server running on port ${PORT}`);
});
