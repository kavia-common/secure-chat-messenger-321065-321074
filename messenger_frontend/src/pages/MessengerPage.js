import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createChat, listChats, listMembers, listMessages, addMember, removeMember, sendMessage } from "../api/chats";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { MembersModal } from "../components/MembersModal";
import { createRealtimeClient } from "../realtime/realtimeClient";

function initials(nameOrEmail) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "G";
  const parts = s.split(/\s+/g);
  const a = parts[0]?.[0] || "G";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (s.includes("@") ? s[1] : "");
  return (a + (b || "")).toUpperCase();
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessengerPage() {
  const { user, token, logout } = useAuth();

  const [chatQuery, setChatQuery] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [composer, setComposer] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const realtimeRef = useRef(null);
  const scrollerRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((c) => String(c.id) === String(activeChatId)) || null,
    [chats, activeChatId]
  );

  const filteredChats = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [chats, chatQuery]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setInfo("");
      try {
        const data = await listChats(token);
        const list = data?.items || data?.chats || data || [];
        if (!cancelled) {
          const arr = Array.isArray(list) ? list : [];
          setChats(arr);
          if (!activeChatId && arr.length) setActiveChatId(arr[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          // In current environment backend may not have these endpoints yet.
          setInfo("Backend chat endpoints not available yet in this environment. UI is ready; wiring will work once backend routes exist.");
        }
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadMsgs() {
      if (!activeChatId) {
        setMessages([]);
        return;
      }
      setError("");
      try {
        const data = await listMessages(token, activeChatId);
        const list = data?.items || data?.messages || data || [];
        if (!cancelled) setMessages(Array.isArray(list) ? list : []);
        setTimeout(() => {
          scrollerRef.current?.scrollTo?.({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
        }, 0);
      } catch (e) {
        if (!cancelled) setMessages([]);
      }
    }

    loadMsgs();
    return () => { cancelled = true; };
  }, [token, activeChatId]);

  useEffect(() => {
    // Setup realtime connection (non-fatal if backend not present yet).
    const rt = createRealtimeClient({
      token,
      onMessage: (evt) => {
        // Expected evt: { chatId, id, text, sender, senderId, createdAt }
        if (!evt) return;
        const evtChatId = String(evt.chatId ?? evt.ChatId ?? "");
        if (!evtChatId) return;

        setChats((prev) => prev.map((c) => String(c.id) === evtChatId
          ? { ...c, lastMessagePreview: evt.text || evt.message || c.lastMessagePreview }
          : c
        ));

        if (String(activeChatId) === evtChatId) {
          setMessages((prev) => [...prev, {
            id: evt.id || `${Date.now()}`,
            text: evt.text || evt.message || "",
            senderDisplayName: evt.senderDisplayName || evt.sender || "User",
            senderId: evt.senderId || evt.userId,
            createdAt: evt.createdAt || new Date().toISOString()
          }]);
          setTimeout(() => {
            scrollerRef.current?.scrollTo?.({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
          }, 0);
        }
      }
    });

    realtimeRef.current = rt;

    let stopped = false;
    (async () => {
      const ok = await rt.start();
      if (!ok) return;
      if (activeChatId) await rt.joinChat(String(activeChatId));
    })();

    return () => {
      if (stopped) return;
      stopped = true;
      rt.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    (async () => {
      if (!realtimeRef.current || !activeChatId) return;
      await realtimeRef.current.joinChat(String(activeChatId));
    })();
  }, [activeChatId]);

  async function onCreateGroup(payload) {
    setError("");
    const data = await createChat(token, payload);
    const created = data?.chat || data;
    setChats((prev) => [created, ...prev]);
    setActiveChatId(created?.id);
  }

  async function onSend() {
    const text = composer.trim();
    if (!text || !activeChatId) return;

    setComposer("");
    setError("");

    // Optimistic UI
    const optimistic = {
      id: `local-${Date.now()}`,
      text,
      senderDisplayName: user?.displayName || user?.name || user?.email || "Me",
      senderId: user?.id || "me",
      createdAt: new Date().toISOString(),
      _optimistic: true
    };
    setMessages((prev) => [...prev, optimistic]);

    setTimeout(() => {
      scrollerRef.current?.scrollTo?.({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    }, 0);

    try {
      const res = await sendMessage(token, activeChatId, { text });
      const msg = res?.message || res;
      if (msg) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...msg } : m)));
      }
      setChats((prev) => prev.map((c) => String(c.id) === String(activeChatId)
        ? { ...c, lastMessagePreview: text }
        : c
      ));
    } catch (e) {
      // Rollback optimistic message if backend unavailable
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(e?.message || "Failed to send message.");
    }
  }

  return (
    <>
      <div className="appShell">
        <aside className="sidebar">
          <div className="sidebarHeader">
            <div className="brandRow">
              <div className="brand" title="Secure Chat Messenger">
                <div className="brandMark" aria-hidden="true" />
                <div className="brandText">
                  <div className="title">Secure Messenger</div>
                  <div className="subtitle">Light · Real-time</div>
                </div>
              </div>

              <div className="sidebarActions">
                <button className="iconBtn" onClick={() => setShowCreateGroup(true)} aria-label="Create group">＋</button>
              </div>
            </div>

            <div className="searchBox">
              <input
                className="input"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Search chats…"
                aria-label="Search chats"
              />
            </div>
          </div>

          <div className="chatList" role="list">
            {filteredChats.length === 0 ? (
              <div className="kbdHint" style={{ padding: 10 }}>
                No chats yet. Create a group to begin.
              </div>
            ) : filteredChats.map((c) => {
              const isActive = String(c.id) === String(activeChatId);
              return (
                <div
                  key={c.id}
                  className={`chatItem ${isActive ? "active" : ""}`}
                  onClick={() => setActiveChatId(c.id)}
                  role="listitem"
                  aria-label={`Open chat ${c.name}`}
                >
                  <div className="avatar" aria-hidden="true">{initials(c.name)}</div>

                  <div className="chatItemMain">
                    <div className="chatNameRow">
                      <div className="chatName">{c.name || "Unnamed group"}</div>
                    </div>
                    <div className="chatPreview">{c.lastMessagePreview || "No messages yet"}</div>
                  </div>

                  {c.unreadCount ? <div className="badge">{c.unreadCount}</div> : <div />}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbarLeft">
              <div className="avatar" aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 14 }}>
                {initials(activeChat?.name || "Chat")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="topbarTitle">{activeChat?.name || "Select a chat"}</div>
                <div className="topbarMeta">
                  {user?.displayName || user?.name || user?.email || "Signed in"}
                </div>
              </div>
            </div>

            <div className="topbarRight">
              <button
                className="btn btnSmall"
                onClick={() => setShowMembers(true)}
                disabled={!activeChat}
              >
                Members
              </button>
              <button className="btn btnSmall" onClick={logout}>Sign out</button>
            </div>
          </div>

          <div className="content">
            <div className="conversation" ref={scrollerRef}>
              {info ? <div className="alert alertSuccess">{info}</div> : null}
              {error ? <div className="alert" role="alert">{error}</div> : null}

              {!activeChat ? (
                <div className="kbdHint">Choose a chat from the sidebar or create a new group.</div>
              ) : messages.length === 0 ? (
                <div className="kbdHint">No messages yet. Start the conversation.</div>
              ) : messages.map((m) => {
                const mine = (m.senderId && user?.id) ? String(m.senderId) === String(user.id) : (m.senderDisplayName === "Me");
                return (
                  <div key={m.id} className={`messageRow ${mine ? "mine" : ""}`}>
                    <div className={`bubble ${mine ? "mine" : ""}`}>
                      <div className="meta">
                        <div className="sender">{m.senderDisplayName || "User"}</div>
                        <div className="time">{formatTime(m.createdAt)}</div>
                      </div>
                      <div className="text">{m.text || ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="composer">
              <div className="composerRow">
                <textarea
                  className="textarea"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder={activeChat ? "Write a message…" : "Select a chat to start messaging…"}
                  disabled={!activeChat}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                />
                <button className="btn btnPrimary" onClick={onSend} disabled={!activeChat || !composer.trim()}>
                  Send
                </button>
              </div>
              <div className="kbdHint" style={{ marginTop: 8 }}>
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          </div>
        </main>
      </div>

      {showCreateGroup ? (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={onCreateGroup}
        />
      ) : null}

      {showMembers && activeChat ? (
        <MembersModal
          chat={activeChat}
          onClose={() => setShowMembers(false)}
          loadMembers={(chatId) => listMembers(token, chatId)}
          onAddMember={(chatId, payload) => addMember(token, chatId, payload)}
          onRemoveMember={(chatId, memberUserId) => removeMember(token, chatId, memberUserId)}
        />
      ) : null}
    </>
  );
}
