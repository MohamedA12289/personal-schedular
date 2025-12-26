"use client";

import { useEffect, useMemo, useState } from "react";

type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO
};

const STORAGE_KEY = "my-schedule-tasks";

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TaskItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: TaskItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

export function TasksView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [value, setValue] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    setTasks(readTasks());
  }, []);

  useEffect(() => {
    writeTasks(tasks);
  }, [tasks]);

  const filtered = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const addTask = () => {
    const title = value.trim();
    if (!title) return;
    const next: TaskItem = {
      id: uid(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [next, ...prev]);
    setValue("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <section className="space-y-4" id="tab-panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Tasks</p>
            <h2 className="text-2xl font-semibold text-slate-900">To-do list</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                filter === "all" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                filter === "active" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                filter === "completed" ? "bg-teal-500 text-white" : "bg-white text-slate-700 shadow-sm"
              }`}
            >
              Completed
            </button>

            <button
              type="button"
              onClick={clearCompleted}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-200 hover:text-teal-700"
            >
              Clear completed
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
            placeholder="Add a task…"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none"
          />
          <button
            type="button"
            onClick={addTask}
            className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-teal-600"
          >
            Add
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks here yet.</p>
          ) : (
            filtered.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
              >
                <label className="flex items-center gap-3">
                  {/* ✅ MARK FINISHED (checkbox) */}
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="h-4 w-4 accent-teal-600"
                  />
                  <span className={`text-sm ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {task.title}
                  </span>
                </label>

                {/* 🗑 DELETE */}
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
