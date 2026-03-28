export interface TaskObjective {
  id: string;
  description: string;
  type: string;
  optional: boolean;
}

export interface TarkovTask {
  id: string;
  name: string;
  trader: string;
  map: string | null;
  minPlayerLevel: number;
  experience: number;
  wikiLink: string;
  taskRequirements: string[]; // task IDs that must be completed first
  objectives: TaskObjective[];
}
