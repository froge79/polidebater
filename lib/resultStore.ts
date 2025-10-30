import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DebaterResults {
  clarity: number,
  evidence_quality: number,
  overall: number,
  persuasiveness: number,
  responsiveness: number,
  structure_adherence: number
}

interface DebateConfig {
    topic: string,
    side: string,
    difficulty: string,
    totalRounds: number,
}

interface ResultState {
  aiResults: DebaterResults | null;
  humanResults: DebaterResults | null;
  debateConfig: DebateConfig | null;
  aiSummary: string;
  humanSummary: string;
  originURL: string;
  setAIResults: (results: DebaterResults) => void;
  setHumanResults: (results: DebaterResults) => void;
  setAISummary: (summary: string) => void;
  setHumanSummary: (summary: string) => void;
  setDebateConfig: (config: DebateConfig) => void;
  setOriginURL: (url: string) => void;
  clearStore: () => void;
}

export const useResultStore = create<ResultState>()(
  persist(
    (set) => ({
        aiResults: null,
        humanResults: null,
        aiSummary: "",
        humanSummary: "",
        debateConfig: null,
        originURL: "",
        setAIResults: (results) => set({ aiResults: results }),
        setHumanResults: (results) => set({ humanResults: results }),
        setAISummary: (summary) => set({ aiSummary: summary }),
        setHumanSummary: (summary) => set({ humanSummary: summary }),
        setDebateConfig: (config) => set({ debateConfig: config }),
        setOriginURL: (url) => set({ originURL: url }),
        clearStore: () => set({ aiResults: null, humanResults: null, aiSummary: "", humanSummary: "", debateConfig: null, originURL: "" }),
    }),
    {
      name: "result-storage", 
    }
  )
);
