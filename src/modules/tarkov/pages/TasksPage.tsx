import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import { useTarkovStore } from "../stores/tarkovStore";
import SearchInput from "@/shared/ui/SearchInput";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import ExternalLink from "@/shared/ui/ExternalLink";
import type { TarkovTask } from "../types/tasks";

type FilterMode = "all" | "active" | "completed";

function TasksPage() {
  const [search, setSearch] = useState("");
  const [traderFilter, setTraderFilter] = useState("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const completedTasks = useTarkovStore((s) => s.completedTasks);
  const completedObjectives = useTarkovStore((s) => s.completedObjectives);
  const toggleTask = useTarkovStore((s) => s.toggleTask);
  const toggleObjective = useTarkovStore((s) => s.toggleObjective);

  const queryResult = useLiveQuery(() => tarkovDb.tasks.toArray());
  const isLoading = queryResult === undefined;
  const allTasks = queryResult ?? [];

  // Derive trader list from actual data
  const traders = useMemo(() => {
    const names = new Set<string>();
    allTasks.forEach((t) => names.add(t.trader));
    return Array.from(names).sort();
  }, [allTasks]);

  const filtered = useMemo(() => {
    let result = allTasks;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.trader.toLowerCase().includes(q)
      );
    }

    if (traderFilter !== "All") {
      result = result.filter((t) => t.trader === traderFilter);
    }

    if (filterMode === "completed") {
      result = result.filter((t) => completedTasks.includes(t.id));
    } else if (filterMode === "active") {
      result = result.filter((t) => !completedTasks.includes(t.id));
    }

    // Sort: incomplete first, then by level, then name
    return result.sort((a, b) => {
      const aComplete = completedTasks.includes(a.id) ? 1 : 0;
      const bComplete = completedTasks.includes(b.id) ? 1 : 0;
      if (aComplete !== bComplete) return aComplete - bComplete;
      if (a.minPlayerLevel !== b.minPlayerLevel) return a.minPlayerLevel - b.minPlayerLevel;
      return a.name.localeCompare(b.name);
    });
  }, [allTasks, search, traderFilter, filterMode, completedTasks]);

  const completedCount = allTasks.filter((t) => completedTasks.includes(t.id)).length;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Task Tracker</h1>
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading tasks..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Task Tracker</h1>
      <p className="text-text-secondary mb-4">
        {completedCount} / {allTasks.length} completed
      </p>

      {/* Progress bar */}
      <div className="mb-4 max-w-2xl">
        <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${allTasks.length > 0 ? (completedCount / allTasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
        </div>
        <select
          value={traderFilter}
          onChange={(e) => setTraderFilter(e.target.value)}
          className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                     text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          {traders.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "active", "completed"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${
                filterMode === mode
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary border border-border p-8 text-center text-sm text-text-muted">
          {allTasks.length === 0
            ? "No tasks cached yet. Wait for sync."
            : "No tasks match your filters."}
        </div>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={completedTasks.includes(task.id)}
              completedObjectives={completedObjectives}
              onToggleTask={toggleTask}
              onToggleObjective={toggleObjective}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  isCompleted,
  completedObjectives,
  onToggleTask,
  onToggleObjective,
}: {
  task: TarkovTask;
  isCompleted: boolean;
  completedObjectives: string[];
  onToggleTask: (id: string) => void;
  onToggleObjective: (taskId: string, objId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const objCompleted = task.objectives.filter(
    (o) => completedObjectives.includes(`${task.id}:${o.id}`)
  ).length;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isCompleted
          ? "bg-bg-secondary/50 border-border/50 opacity-60"
          : "bg-bg-secondary border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleTask(task.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            isCompleted
              ? "bg-accent border-accent text-white"
              : "border-border hover:border-accent"
          }`}
        >
          {isCompleted && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm font-medium ${
                isCompleted ? "line-through text-text-muted" : "text-text-primary"
              }`}
            >
              {task.name}
            </h3>
            <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] text-text-secondary">
              {task.trader}
            </span>
            {task.map && (
              <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] text-text-muted">
                {task.map}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
            <span>Lvl {task.minPlayerLevel}+</span>
            <span>{task.experience.toLocaleString()} XP</span>
            <span>{objCompleted}/{task.objectives.length} objectives</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-primary transition-colors text-sm"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Objectives (expandable) */}
      {expanded && (
        <div className="mt-3 ml-8 space-y-1.5">
          {task.objectives.map((obj) => {
            const objKey = `${task.id}:${obj.id}`;
            const isDone = completedObjectives.includes(objKey);
            return (
              <div key={obj.id} className="flex items-start gap-2">
                <button
                  onClick={() => onToggleObjective(task.id, obj.id)}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    isDone
                      ? "bg-success border-success text-white"
                      : "border-border hover:border-success"
                  }`}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-xs ${
                    isDone ? "line-through text-text-muted" : "text-text-secondary"
                  } ${obj.optional ? "italic" : ""}`}
                >
                  {obj.description}
                  {obj.optional && " (optional)"}
                </span>
              </div>
            );
          })}
          {task.wikiLink && (
            <ExternalLink
              href={task.wikiLink}
              className="text-xs text-accent hover:text-accent-hover mt-2 inline-block"
            >
              View on Wiki →
            </ExternalLink>
          )}
        </div>
      )}
    </div>
  );
}

export default TasksPage;
