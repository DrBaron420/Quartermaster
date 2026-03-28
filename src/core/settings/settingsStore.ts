import { create } from "zustand";

interface SettingsState {
  /** IDs of enabled game modules */
  enabledModules: string[];

  /** Current theme */
  theme: "dark" | "light";

  /** Sync interval in minutes */
  syncIntervalMinutes: number;

  /** Toggle a module on or off */
  toggleModule: (moduleId: string) => void;

  /** Set the theme */
  setTheme: (theme: "dark" | "light") => void;

  /** Set sync interval */
  setSyncInterval: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  enabledModules: [],
  theme: "dark",
  syncIntervalMinutes: 15,

  toggleModule: (moduleId) =>
    set((state) => ({
      enabledModules: state.enabledModules.includes(moduleId)
        ? state.enabledModules.filter((id) => id !== moduleId)
        : [...state.enabledModules, moduleId],
    })),

  setTheme: (theme) => set({ theme }),

  setSyncInterval: (minutes) => set({ syncIntervalMinutes: minutes }),
}));
