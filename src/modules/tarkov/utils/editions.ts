/** Game editions available in Escape from Tarkov */
export type GameEdition =
  | "standard"
  | "left_behind"
  | "prepare_for_escape"
  | "edge_of_darkness"
  | "unheard";

/** PvP (regular) or PvE game mode */
export type GameMode = "regular" | "pve";

export interface EditionConfig {
  label: string;
  stashLevel: number;
  container: string;
  traderRepBonus: number;
}

export const EDITIONS: Record<GameEdition, EditionConfig> = {
  standard: {
    label: "Standard",
    stashLevel: 1,
    container: "Alpha (2x2)",
    traderRepBonus: 0,
  },
  left_behind: {
    label: "Left Behind",
    stashLevel: 2,
    container: "Beta (3x2)",
    traderRepBonus: 0,
  },
  prepare_for_escape: {
    label: "Prepare for Escape",
    stashLevel: 3,
    container: "Beta (3x2)",
    traderRepBonus: 0.2,
  },
  edge_of_darkness: {
    label: "Edge of Darkness (Legacy)",
    stashLevel: 4,
    container: "Gamma (3x3)",
    traderRepBonus: 0.2,
  },
  unheard: {
    label: "The Unheard Edition",
    stashLevel: 4,
    container: "Theta (4x2+1x2)",
    traderRepBonus: 0.2,
  },
};

export const GAME_MODES: Record<GameMode, string> = {
  regular: "PvP",
  pve: "PvE",
};
