const WS_BASE_URL = import.meta.env.VITE_WS_URL;

type MessageHandler = (event: MessageEvent) => void;

let socket: WebSocket | null = null;
const messageHandlers = new Set<MessageHandler>();

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function buildUrl(): string {
  const token = getAccessToken();
  const encodedToken = token ? encodeURIComponent(token) : "";
  return `${WS_BASE_URL}/rooms?access_token=${encodedToken}`;
}

function handleMessage(event: MessageEvent) {
  console.log("[ws] message received:", event.data);
  for (const handler of messageHandlers) {
    handler(event);
  }
}

function handleOpen() {
  console.log("[ws] connected");
}

function handleClose(event: CloseEvent) {
  console.log("[ws] disconnected", event.code, event.reason);
  socket = null;
}

function handleError(event: Event) {
  console.error("[ws] error", event);
}

export const wsService = {
  connect() {
    if (socket && socket.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(buildUrl());
    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);
  },

  disconnect() {
    if (!socket) return;
    socket.close();
    socket = null;
  },

  isConnected(): boolean {
    return socket !== null && socket.readyState === WebSocket.OPEN;
  },

  onMessage(handler: MessageHandler): () => void {
    messageHandlers.add(handler);
    return () => {
      messageHandlers.delete(handler);
    };
  },
};
