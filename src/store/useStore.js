import { create } from 'zustand';

interface PrinterState {
  host: string;
  isConnected: boolean;
  status: 'idle' | 'printing' | 'paused' | 'error';
  temperature: {
    tool: number;
    bed: number;
  };
  progress: number;
  currentFile: string | null;
  setHost: (host: string) => void;
  setConnectionStatus: (status: boolean) => void;
  updateStatus: (data: Partial<Omit<PrinterState, 'setHost' | 'setConnectionStatus' | 'updateStatus'>>) => void;
}

export const usePrinterStore = create<PrinterState>((set) => ({
  host: '',
  isConnected: false,
  status: 'idle',
  temperature: {
    tool: 0,
    bed: 0,
  },
  progress: 0,
  currentFile: null,
  setHost: (host) => set({ host }),
  setConnectionStatus: (isConnected) => set({ isConnected }),
  updateStatus: (data) => set((state) => ({ ...state, ...data })),
}));

interface AppState {
  isSlicing: boolean;
  setSlicing: (isSlicing: boolean) => void;
  lastDownloadedFile: string | null;
  setLastDownloadedFile: (file: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSlicing: false,
  setSlicing: (isSlicing) => set({ isSlicing }),
  lastDownloadedFile: null,
  setLastDownloadedFile: (lastDownloadedFile) => set({ lastDownloadedFile }),
}));
