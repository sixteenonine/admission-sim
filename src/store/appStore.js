import { create } from 'zustand';

import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      reflectionHistory: [],
      draftSession: null,
      examSequence: null,
      customPresets: null,
      setAppState: (key, value) => set({ [key]: value }),
    }),
    { name: 'bw-app-store' }
  )
);