import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CraftListItem, XpGoal } from "../types/crafting";

interface BitcraftStoreState {
  /** Opt-in market prices */
  marketEnabled: boolean;
  setMarketEnabled: (v: boolean) => void;

  /** XP goals (pinnable to dashboard) */
  xpGoals: XpGoal[];
  addXpGoal: (goal: Omit<XpGoal, "id" | "createdAt">) => void;
  removeXpGoal: (id: string) => void;
  toggleXpGoalPin: (id: string) => void;
  updateXpGoal: (id: string, updates: Partial<Pick<XpGoal, "currentLevel" | "targetLevel">>) => void;

  /** Craft list with gathered tracking */
  craftList: CraftListItem[];
  addToCraftList: (item: Omit<CraftListItem, "id" | "gathered" | "createdAt">) => void;
  removeFromCraftList: (id: string) => void;
  updateGathered: (id: string, itemId: string, quantity: number) => void;
  clearCraftList: () => void;

  /** Pinned items for quick reference */
  pinnedItems: string[];
  togglePinItem: (itemId: string) => void;
  isItemPinned: (itemId: string) => boolean;
}

export const useBitcraftStore = create<BitcraftStoreState>()(
  persist(
    (set, get) => ({
      marketEnabled: false,
      setMarketEnabled: (v) => set({ marketEnabled: v }),

      // XP Goals
      xpGoals: [],
      addXpGoal: (goal) =>
        set((state) => ({
          xpGoals: [
            ...state.xpGoals,
            { ...goal, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      removeXpGoal: (id) =>
        set((state) => ({
          xpGoals: state.xpGoals.filter((g) => g.id !== id),
        })),
      toggleXpGoalPin: (id) =>
        set((state) => ({
          xpGoals: state.xpGoals.map((g) =>
            g.id === id ? { ...g, pinned: !g.pinned } : g
          ),
        })),
      updateXpGoal: (id, updates) =>
        set((state) => ({
          xpGoals: state.xpGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      // Craft List
      craftList: [],
      addToCraftList: (item) =>
        set((state) => ({
          craftList: [
            ...state.craftList,
            { ...item, id: crypto.randomUUID(), gathered: {}, createdAt: Date.now() },
          ],
        })),
      removeFromCraftList: (id) =>
        set((state) => ({
          craftList: state.craftList.filter((i) => i.id !== id),
        })),
      updateGathered: (id, itemId, quantity) =>
        set((state) => ({
          craftList: state.craftList.map((i) =>
            i.id === id
              ? { ...i, gathered: { ...i.gathered, [itemId]: quantity } }
              : i
          ),
        })),
      clearCraftList: () => set({ craftList: [] }),

      // Pinned Items
      pinnedItems: [],
      togglePinItem: (itemId) =>
        set((state) => ({
          pinnedItems: state.pinnedItems.includes(itemId)
            ? state.pinnedItems.filter((id) => id !== itemId)
            : [...state.pinnedItems, itemId],
        })),
      isItemPinned: (itemId) => get().pinnedItems.includes(itemId),
    }),
    {
      name: "bitcraft-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
