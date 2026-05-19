import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  Copy,
  Image,
  Link as LinkIcon,
  LogIn,
  MessageCircle,
  Paperclip,
  Pencil,
  Send,
  Users,
  X
} from "lucide-react";
import "./styles.css";

const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
  autoConnect: false
});

const quickEmojis = ["👍", "🙋", "✨", "😊", "🔥", "👏"];
const maxFileBytes = 3 * 1024 * 1024;

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function fileSizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return path;
}

function JoinScreen({ onJoin, isConnecting }) {
  const [name, setName] = useState(localStorage.getItem("waveroom-name") || "");

  function submit(event) {
    event.preventDefault();
    onJoin(name);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#ffffff_35%,#eaf3ff_100%)] px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-lakeBlue shadow-sm ring-1 ring-blue-100">
              <MessageCircle size={17} />
              鹿多多課程研討會即時互動
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                鹿多多 AI 課程互動聊天室
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                為課程問答、分組討論與活動回饋打造的即時互動空間。輸入姓名後即可加入同一聊天室，支援文字、圖片、文字檔與快速表情回應。
              </p>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {["即時同步", "課堂互動", "附件分享"].map((item) => (
                <div key={item} className="rounded-lg border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{item}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-gradient-to-r from-deerOrange to-lakeBlue" />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="rounded-[28px] border border-white bg-white/90 p-6 shadow-soft backdrop-blur md:p-8">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-deerOrange">
              <LogIn size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-950">進入聊天室</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">請輸入姓名或暱稱，方便講師與同學辨識你的訊息。</p>
            <label className="mt-7 block text-sm font-bold text-slate-700" htmlFor="name">
              姓名或暱稱
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-lakeBlue focus:ring-4 focus:ring-blue-100"
              placeholder="例如：鹿多多、小鹿老師"
              autoFocus
            />
            <button
              type="submit"
              disabled={isConnecting || !name.trim()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lakeBlue px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <LogIn size={20} />
              {isConnecting ? "連線中..." : "加入 WaveRoom"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AttachmentPreview({ attachment }) {
  if (!attachment) return null;

  const isImage = attachment.mimeType?.startsWith("image/");
  return (
    <a
      href={apiUrl(attachment.url)}
      target="_blank"
      rel="noreferrer"
      className="mt-3 block overflow-hidden rounded-lg border border-slate-200 bg-white"
    >
      {isImage ? (
        <img src={apiUrl(attachment.url)} alt={attachment.name} className="max-h-64 w-full object-cover" />
      ) : (
        <div className="flex items-center gap-3 p-3 text-sm text-slate-700">
          <Paperclip size={18} className="text-deerOrange" />
          <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
          <span className="shrink-0 text-xs text-slate-400">{fileSizeLabel(attachment.size)}</span>
        </div>
      )}
    </a>
  );
}

function ChatMessage({ message, ownId }) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          {message.text}
        </span>
      </div>
    );
  }

  const isOwn = message.user?.id === ownId;
  return (
    <article className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
        style={{ backgroundColor: message.user?.color || "#2563EB" }}
      >
        {message.user?.name?.slice(0, 1) || "?"}
      </div>
      <div className={`min-w-0 max-w-[78%] ${isOwn ? "text-right" : ""}`}>
        <div className={`mb-1 flex items-center gap-2 text-xs text-slate-500 ${isOwn ? "justify-end" : ""}`}>
          <span className="font-bold text-slate-700">{message.user?.name}</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-left leading-7 shadow-sm ${
            isOwn ? "rounded-tr-sm bg-lakeBlue text-white" : "rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200"
          }`}
        >
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          <AttachmentPreview attachment={message.attachment} />
        </div>
      </div>
    </article>
  );
}

function ChatRoom({ currentUser, initialMessages, initialRoomState, onRename }) {
  const [messages, setMessages] = useState(initialMessages);
  const [roomState, setRoomState] = useState(initialRoomState);
  const [typingUsers, setTypingUsers] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState(currentUser.name);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onHistory = (history) => setMessages(history);
    const onNewMessage = (message) => setMessages((current) => [...current, message]);
    const onRoomState = (state) => setRoomState(state);
    const onTyping = (users) => setTypingUsers(users.filter((user) => user.id !== currentUser.id));

    socket.on("messages:history", onHistory);
    socket.on("message:new", onNewMessage);
    socket.on("room:state", onRoomState);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("messages:history", onHistory);
      socket.off("message:new", onNewMessage);
      socket.off("room:state", onRoomState);
      socket.off("typing:update", onTyping);
    };
  }, [currentUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typingUsers]);

  const typingLabel = useMemo(() => {
    if (!typingUsers.length) return "";
    if (typingUsers.length === 1) return `${typingUsers[0].name} 正在輸入中`;
    if (typingUsers.length === 2) return `${typingUsers[0].name}、${typingUsers[1].name} 正在輸入中`;
    return `${typingUsers[0].name} 等 ${typingUsers.length} 人正在輸入中`;
  }, [typingUsers]);

  function markTyping(value) {
    setText(value);
    socket.emit(value.trim() ? "typing:start" : "typing:stop");
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => socket.emit("typing:stop"), 1200);
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) return;
    if (selected.size > maxFileBytes) {
      setError("單檔大小不可超過 3MB。");
      event.target.value = "";
      return;
    }
    if (!selected.type.startsWith("image/") && !["text/plain", "text/markdown", "application/json"].includes(selected.type)) {
      setError("僅支援圖片與文字檔。");
      event.target.value = "";
      return;
    }
    setFile(selected);
  }

  async function uploadAttachment() {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "附件上傳失敗。");
    }
    return result.file;
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!text.trim() && !file) return;

    setError("");
    setIsUploading(true);
    try {
      const attachment = await uploadAttachment();
      socket.emit("message:send", { text, attachment }, (response) => {
        if (!response?.ok) {
          setError(response?.error || "訊息送出失敗。");
        }
      });
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket.emit("typing:stop");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  function sendEmoji(emoji) {
    socket.emit("message:send", { text: emoji });
    socket.emit("typing:stop");
  }

  function submitRename(event) {
    event.preventDefault();
    socket.emit("user:rename", draftName, (response) => {
      if (!response?.ok) {
        setError(response?.error || "更換名稱失敗。");
        return;
      }
      localStorage.setItem("waveroom-name", response.user.name);
      onRename(response.user);
      setRenameOpen(false);
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-deerOrange">
                <MessageCircle size={25} />
              </div>
              <h1 className="text-2xl font-black leading-tight text-slate-950">鹿多多 AI 課程互動聊天室</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                WaveRoom 即時互動空間，適合課堂提問、研討會討論與活動回饋。
              </p>
            </div>
            <button
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-blue-100 bg-softBlue px-3 py-2 text-sm font-bold text-lakeBlue transition hover:bg-blue-100 lg:mt-5"
              title="複製聊天室連結"
            >
              {copied ? <Copy size={17} /> : <LinkIcon size={17} />}
              <span className="hidden sm:inline lg:inline">{copied ? "已複製" : "複製連結"}</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Users size={18} className="text-deerOrange" />
                線上人數
              </div>
              <p className="mt-2 text-3xl font-black text-slate-950">{roomState.onlineCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-600">目前名稱</p>
                <button
                  onClick={() => setRenameOpen(true)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-lakeBlue"
                  title="更換名稱"
                >
                  <Pencil size={17} />
                </button>
              </div>
              <p className="mt-2 truncate text-lg font-black text-slate-950">{currentUser.name}</p>
            </div>
          </div>

          <section className="mt-5">
            <h2 className="mb-3 text-sm font-black text-slate-700">在線成員</h2>
            <div className="max-h-64 space-y-2 overflow-auto pr-1 lg:max-h-[calc(100vh-390px)]">
              {roomState.users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user.name}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex min-h-[calc(100vh-320px)] flex-col lg:min-h-screen">
          <header className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-deerOrange">WaveRoom</p>
                <h2 className="text-xl font-black text-slate-950">課程互動訊息區</h2>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-lakeBlue">
                即時同步
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              {messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center text-slate-500">
                  還沒有訊息，開始第一個課程互動吧。
                </div>
              ) : (
                messages.map((message) => <ChatMessage key={message.id} message={message} ownId={currentUser.id} />)
              )}
              {typingLabel && <p className="pl-2 text-sm font-semibold text-slate-500">{typingLabel}...</p>}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-4xl">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
              {file && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm">
                  <Paperclip size={18} className="text-deerOrange" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
                  <span className="text-xs text-slate-500">{fileSizeLabel(file.size)}</span>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="rounded-md p-1 text-slate-500 hover:bg-white"
                    title="移除附件"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <div className="mb-3 flex flex-wrap gap-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendEmoji(emoji)}
                    className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-lg transition hover:border-orange-200 hover:bg-orange-50"
                    title={`送出 ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={submitMessage} className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.txt,.md,.json,text/plain,text/markdown,application/json"
                  onChange={chooseFile}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-deerOrange"
                  title="上傳圖片或文字檔"
                >
                  <Image size={20} />
                </button>
                <textarea
                  value={text}
                  onChange={(event) => markTyping(event.target.value)}
                  rows={1}
                  className="max-h-32 min-h-12 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 leading-6 outline-none transition focus:border-lakeBlue focus:ring-4 focus:ring-blue-100"
                  placeholder="輸入訊息、問題或活動回饋..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage(event);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isUploading || (!text.trim() && !file)}
                  className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-lg bg-deerOrange px-4 font-bold text-white shadow-lg shadow-orange-100 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:min-w-28"
                >
                  <Send size={19} />
                  <span className="hidden sm:inline">{isUploading ? "處理中" : "送出"}</span>
                </button>
              </form>
            </div>
          </footer>
        </section>
      </div>

      {renameOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/35 px-4">
          <form onSubmit={submitRename} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-black text-slate-950">更換名稱</h3>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={24}
              className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-lakeBlue focus:ring-4 focus:ring-blue-100"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button type="submit" className="rounded-lg bg-lakeBlue px-4 py-2 font-bold text-white hover:bg-blue-700">
                儲存
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [initialRoomState, setInitialRoomState] = useState({ onlineCount: 0, users: [] });
  const [isConnecting, setIsConnecting] = useState(false);
  const [joinError, setJoinError] = useState("");

  function joinRoom(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      setJoinError("請輸入姓名或暱稱。");
      return;
    }

    setIsConnecting(true);
    setJoinError("");
    if (!socket.connected) socket.connect();

    socket.emit("user:join", trimmed, (response) => {
      setIsConnecting(false);
      if (!response?.ok) {
        setJoinError(response?.error || "加入聊天室失敗。");
        return;
      }
      localStorage.setItem("waveroom-name", response.user.name);
      setInitialMessages(response.messages || []);
      setInitialRoomState(response.roomState || { onlineCount: 0, users: [] });
      setCurrentUser(response.user);
    });
  }

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  return currentUser ? (
    <ChatRoom
      currentUser={currentUser}
      initialMessages={initialMessages}
      initialRoomState={initialRoomState}
      onRename={setCurrentUser}
    />
  ) : (
    <>
      <JoinScreen onJoin={joinRoom} isConnecting={isConnecting} />
      {joinError && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {joinError}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
