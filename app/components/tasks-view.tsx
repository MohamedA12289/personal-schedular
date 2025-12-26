"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { useTasks } from "@/app/hooks/use-tasks";
import type { TaskItem } from "@/app/types/task";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function filterTasks(tasks: TaskItem[], filter: FilterKey) {
  if (filter === "active") return tasks.filter((task) => !task.completed);
  if (filter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

export function TasksView() {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addTask(title);
    setTitle("");
  };

  return (
    <section className="space-y-4" aria-label="Tasks">
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Tasks</p>
            <h2 className="text-2xl font-semibold text-slate-900">Stay on top of your todos</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <span>{tasks.length} total</span>
            <span className="h-4 w-px bg-slate-300" aria-hidden />
            <span>{tasks.filter((task) => !task.completed).length} active</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="task-title">
            Task title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:bg-white"
            required
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            Add task
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Task filters">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === item.key
                  ? "bg-teal-100 text-teal-800 ring-1 ring-inset ring-teal-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              aria-pressed={filter === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks yet. Add one to get started.</p>
          ) : (
            filtered.map((task) => (
              <article
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500">Added {new Date(task.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}