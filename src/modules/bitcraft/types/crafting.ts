export interface RecipeTreeNode {
  itemId: string;
  itemName: string;
  quantity: number;
  tier: number;
  isRawMaterial: boolean;
  children: RecipeTreeNode[];
}

export interface MaterialBreakdown {
  itemId: string;
  itemName: string;
  totalQuantity: number;
  tier: number;
}

export interface CraftListItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  gathered: Record<string, number>;
  createdAt: number;
}

export interface XpGoal {
  id: string;
  profession: string;
  currentLevel: number;
  targetLevel: number;
  pinned: boolean;
  createdAt: number;
}
