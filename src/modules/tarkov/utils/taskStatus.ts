import type { TarkovTask } from "../types/tasks";

export type TaskStatus = "completed" | "available" | "locked";

/**
 * Task IDs that require negative scav karma (-1.0 or worse).
 * The API doesn't expose this prerequisite, so we hardcode them.
 * These are Fence's "Compensation for Damage" series and "Establish Contact".
 */
const NEGATIVE_KARMA_TASKS = new Set([
  "61e6e5e0f5b9633f6719ed95", // Compensation for Damage - Trust
  "61e6e60223374d168a4576a6", // Compensation for Damage - Wager
  "61e6e615eea2935bc018a2c5", // Compensation for Damage - Barkeep
  "61e6e621bfeab00251576265", // Compensation for Damage - Collection
  "61e6e60c5ca3b3783662be27", // Compensation for Damage - Wergild
  "6672d9def1c88688a707d042", // Establish Contact
]);

/**
 * Determine the status of a task based on prerequisites.
 * A task is "available" when:
 * - Player meets the minimum level requirement
 * - All prerequisite tasks are completed
 * - The task itself is not already completed
 * - The task doesn't require negative scav karma (locked by default)
 */
export function getTaskStatus(
  task: TarkovTask,
  completedTasks: string[],
  playerLevel: number
): TaskStatus {
  if (completedTasks.includes(task.id)) return "completed";

  // Negative karma tasks are locked unless manually completed
  if (NEGATIVE_KARMA_TASKS.has(task.id)) return "locked";

  // Check level requirement
  if (playerLevel < task.minPlayerLevel) return "locked";

  // Check prerequisite tasks
  for (const reqId of task.taskRequirements) {
    if (!completedTasks.includes(reqId)) return "locked";
  }

  return "available";
}

/**
 * Filter tasks to only those that are available (prerequisites met).
 */
export function getAvailableTasks(
  tasks: TarkovTask[],
  completedTasks: string[],
  playerLevel: number
): TarkovTask[] {
  return tasks.filter(
    (t) => getTaskStatus(t, completedTasks, playerLevel) === "available"
  );
}
