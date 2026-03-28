export interface HideoutItemRequirement {
  itemId: string;
  itemName: string;
  itemShortName: string;
  itemIcon: string;
  count: number;
}

export interface HideoutStationRequirement {
  stationName: string;
  level: number;
}

export interface HideoutSkillRequirement {
  name: string;
  level: number;
}

export interface HideoutTraderRequirement {
  traderName: string;
  level: number;
}

export interface HideoutLevel {
  level: number;
  constructionTime: number; // seconds
  description: string;
  itemRequirements: HideoutItemRequirement[];
  stationLevelRequirements: HideoutStationRequirement[];
  skillRequirements: HideoutSkillRequirement[];
  traderRequirements: HideoutTraderRequirement[];
}

export interface HideoutStation {
  id: string;
  name: string;
  levels: HideoutLevel[];
}
