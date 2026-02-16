import * as signalR from "@microsoft/signalr";

function getHubUrl() {
  const explicit = process.env.REACT_APP_SIGNALR_HUB_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  const base = process.env.REACT_APP_API_BASE_URL;
  if (base && base.trim()) return `${base.trim().replace(/\/+$/, "")}/hubs/chat`;

  // Same-origin fallback
  return "/hubs/chat";
}

// PUBLIC_INTERFACE
export function createRealtimeClient({ token, onMessage }) {
  /**
   * Create a realtime client for receiving messages.
   * Expects backend to host a SignalR hub at /hubs/chat that emits "MessageReceived".
   */
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(), {
      accessTokenFactory: () => token || ""
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  connection.on("MessageReceived", (evt) => {
    onMessage?.(evt);
  });

  async function start() {
    try {
      await connection.start();
      return true;
    } catch {
      // Backend may not implement realtime yet; treat as non-fatal
      return false;
    }
  }

  async function stop() {
    try {
      await connection.stop();
    } catch {
      // ignore
    }
  }

  async function joinChat(chatId) {
    try {
      await connection.invoke("JoinChat", chatId);
    } catch {
      // ignore (hub may not support yet)
    }
  }

  async function leaveChat(chatId) {
    try {
      await connection.invoke("LeaveChat", chatId);
    } catch {
      // ignore
    }
  }

  return { start, stop, joinChat, leaveChat };
}
