import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Message {
  id: string
  role: "user" | "ai";
  content: { [key: string]: string }
}

interface DebateState {
  messages: Message[];
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
}

export const useDebateStore = create<DebateState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "debate-storage", 
    }
  )
);
