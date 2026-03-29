import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GameEdition, GameMode } from "../utils/editions";

interface TarkovStoreState {
  /** Selected game edition */
  edition: GameEdition;

  /** Selected game mode (PvP or PvE) */
  gameMode: GameMode;

  /** Player's current level */
  playerLevel: number;

  /** Set the game edition */
  setEdition: (edition: GameEdition) => void;

  /** Set the game mode */
  setGameMode: (mode: GameMode) => void;

  /** Set player level */
  setPlayerLevel: (level: number) => void;

  /** IDs of pinned/favorited items */
  pinnedItems: string[];

  /** IDs of pinned/favorited ammo */
  pinnedAmmo: string[];

  /** IDs of completed tasks */
  completedTasks: string[];

  /** IDs of completed task objectives (taskId:objectiveId) */
  completedObjectives: string[];

  /** Hideout levels completed: "stationId:level" */
  completedHideoutLevels: string[];

  /** Toggle an item pin */
  togglePinItem: (itemId: string) => void;

  /** Toggle an ammo pin */
  togglePinAmmo: (ammoId: string) => void;

  /** Toggle task completion */
  toggleTask: (taskId: string) => void;

  /** Toggle objective completion */
  toggleObjective: (taskId: string, objectiveId: string) => void;

  /** Toggle hideout level completion */
  toggleHideoutLevel: (stationId: string, level: number) => void;

  /** Check if an item is pinned */
  isItemPinned: (itemId: string) => boolean;

  /** Check if ammo is pinned */
  isAmmoPinned: (ammoId: string) => boolean;
}

export const useTarkovStore = create<TarkovStoreState>()(
  persist(
    (set, get) => ({
      edition: "standard",
      gameMode: "regular",
      playerLevel: 1,

      setEdition: (edition) => set({ edition }),
      setGameMode: (mode) => set({ gameMode: mode }),
      setPlayerLevel: (level) => set({ playerLevel: Math.max(1, Math.min(79, level)) }),

      pinnedItems: [],
      pinnedAmmo: [],
      completedTasks: [],
      completedObjectives: [],
      completedHideoutLevels: [],

      togglePinItem: (itemId) =>
        set((state) => ({
          pinnedItems: state.pinnedItems.includes(itemId)
            ? state.pinnedItems.filter((id) => id !== itemId)
            : [...state.pinnedItems, itemId],
        })),

      togglePinAmmo: (ammoId) =>
        set((state) => ({
          pinnedAmmo: state.pinnedAmmo.includes(ammoId)
            ? state.pinnedAmmo.filter((id) => id !== ammoId)
            : [...state.pinnedAmmo, ammoId],
        })),

      toggleTask: (taskId) =>
        set((state) => ({
          completedTasks: state.completedTasks.includes(taskId)
            ? state.completedTasks.filter((id) => id !== taskId)
            : [...state.completedTasks, taskId],
        })),

      toggleObjective: (taskId, objectiveId) => {
        const key = `${taskId}:${objectiveId}`;
        set((state) => ({
          completedObjectives: state.completedObjectives.includes(key)
            ? state.completedObjectives.filter((id) => id !== key)
            : [...state.completedObjectives, key],
        }));
      },

      toggleHideoutLevel: (stationId, level) => {
        const key = `${stationId}:${level}`;
        set((state) => ({
          completedHideoutLevels: state.completedHideoutLevels.includes(key)
            ? state.completedHideoutLevels.filter((id) => id !== key)
            : [...state.completedHideoutLevels, key],
        }));
      },

      isItemPinned: (itemId) => get().pinnedItems.includes(itemId),

      isAmmoPinned: (ammoId) => get().pinnedAmmo.includes(ammoId),
    }),
    {
      name: "tarkov-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
