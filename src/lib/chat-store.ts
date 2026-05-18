import { create } from "zustand";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  createdAt: number;
  updatedAt: number;
}

const LS_KEY = "qyntra:chats:v1";
const MAX_CONVERSATIONS = 20;

function load(): ChatConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as ChatConversation[]).slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

function persist(list: ChatConversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_CONVERSATIONS)));
  } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface ChatStore {
  conversations: ChatConversation[];
  activeId: string | null;
  permissionMode: "ask" | "auto";
  init: () => void;
  newChat: () => string;
  selectChat: (id: string) => void;
  pushMessage: (msg: ChatMsg) => void;
  updateAssistant: (content: string) => void;
  deleteChat: (id: string) => void;
  setPermissionMode: (mode: "ask" | "auto") => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeId: null,
  permissionMode: "ask",
  init: () => {
    const list = load();
    set({
      conversations: list,
      activeId: list[0]?.id || null,
    });
    const savedMode = typeof window !== "undefined" ? localStorage.getItem("qyntra:chat-permission") : null;
    if (savedMode === "auto" || savedMode === "ask") set({ permissionMode: savedMode });
  },
  newChat: () => {
    const conv: ChatConversation = {
      id: uid(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const list = [conv, ...get().conversations].slice(0, MAX_CONVERSATIONS);
    persist(list);
    set({ conversations: list, activeId: conv.id });
    return conv.id;
  },
  selectChat: (id) => set({ activeId: id }),
  pushMessage: (msg) => {
    const state = get();
    let { conversations, activeId } = state;
    if (!activeId) {
      const id = get().newChat();
      activeId = id;
      conversations = get().conversations;
    }
    const next = conversations.map((c) => {
      if (c.id !== activeId) return c;
      const messages = [...c.messages, msg];
      const title =
        c.messages.length === 0 && msg.role === "user"
          ? msg.content.slice(0, 48)
          : c.title;
      return { ...c, messages, title, updatedAt: Date.now() };
    });
    persist(next);
    set({ conversations: next });
  },
  updateAssistant: (content) => {
    const { conversations, activeId } = get();
    if (!activeId) return;
    const next = conversations.map((c) => {
      if (c.id !== activeId) return c;
      const messages = [...c.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = { ...last, content };
      } else {
        messages.push({ role: "assistant", content });
      }
      return { ...c, messages, updatedAt: Date.now() };
    });
    persist(next);
    set({ conversations: next });
  },
  deleteChat: (id) => {
    const next = get().conversations.filter((c) => c.id !== id);
    persist(next);
    const newActive = next[0]?.id || null;
    set({ conversations: next, activeId: newActive });
  },
  setPermissionMode: (mode) => {
    if (typeof window !== "undefined") localStorage.setItem("qyntra:chat-permission", mode);
    set({ permissionMode: mode });
  },
}));
