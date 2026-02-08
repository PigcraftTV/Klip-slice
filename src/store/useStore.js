import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePrinterStore = create(
  persist(
    (set, get) => ({
      printers: [], // Array of { id, name, host, apiKey }
      selectedPrinterId: null,

      // Real-time state (not persisted)
      activePrinterState: {
        isConnected: false,
        status: 'idle',
        temperature: { tool: 0, bed: 0 },
        progress: 0,
        currentFile: null,
      },

      addPrinter: (printer) => set((state) => ({
        printers: [...state.printers, { ...printer, id: Date.now().toString() }]
      })),

      removePrinter: (id) => set((state) => ({
        printers: state.printers.filter(p => p.id !== id),
        selectedPrinterId: state.selectedPrinterId === id ? null : state.selectedPrinterId
      })),

      selectPrinter: (id) => set({ selectedPrinterId: id }),

      updateActivePrinterState: (data) => set((state) => ({
        activePrinterState: { ...state.activePrinterState, ...data }
      })),

      setConnectionStatus: (isConnected) => set((state) => ({
        activePrinterState: { ...state.activePrinterState, isConnected }
      })),
    }),
    {
      name: 'printer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        printers: state.printers,
        selectedPrinterId: state.selectedPrinterId
      }), // Only persist registry, not real-time status
    }
  )
);

export const useAppStore = create(
  persist(
    (set) => ({
      slicingProfiles: [
        { id: '1', name: 'Standard 0.2mm', layerHeight: 0.2, infill: 15 },
        { id: '2', name: 'Fine 0.12mm', layerHeight: 0.12, infill: 20 },
      ],
      lastDownloadedFile: null,

      addProfile: (profile) => set((state) => ({
        slicingProfiles: [...state.slicingProfiles, { ...profile, id: Date.now().toString() }]
      })),

      setLastDownloadedFile: (lastDownloadedFile) => set({ lastDownloadedFile }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
