import type { GameModule } from "@/types/module";
import tarkovModule from "@/modules/tarkov";
import bitcraftModule from "@/modules/bitcraft";

/**
 * Static registry of all available game modules.
 * Import and add modules here as they are built.
 */
export const moduleRegistry: GameModule[] = [
  tarkovModule,
  bitcraftModule,
];
