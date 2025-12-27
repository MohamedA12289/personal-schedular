"use client";

import { useCallback, useEffect, useState } from "react";

import { createEventId } from "@/app/hooks/use-events";
import { localDayKey } from "@/app/lib/date-utils";
import type { TaskItem } from "@/app/types/task";

const STORAGE_KEY = "my-schedule-tasks";

type TaskInput = {
  title: string;
  dayKey: string;
  dueDate?: string;
};

function sanitizeTasks(payload: unknown): TaskItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((task): task is TaskItem => typeof task?.id === "string" && typeof task?.title === "string" && typeof task?.dayKey === "string")
    .map((task, index) => ({
      ...task,
      completed: Boolean(task.completed),
      createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
      order: Number.isFinite((task as TaskItem).order) ? (task as TaskItem).order : index,
    }));
}

function normalizeOrder(tasks: TaskItem[]): TaskItem[] {
  return tasks
    .map((task, index) => ({
      ...task,
      order: Number.isFinite(task.order) ? task.order : index,
    }))
    .sort((a, b) => a.order - b.order)
    .map((task, index) => ({ ...task, order: index }));
}

function readTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed
      .filter((task): task is TaskItem => typeof task?.id === "string" && typeof task?.title === "string")
      .map((task) => ({
        ...task,
        dayKey: typeof task.dayKey === "string" && task.dayKey ? task.dayKey : localDayKey(new Date(task.createdAt ?? Date.now())),
      }));

    return normalizeOrder(cleaned);
  } catch (error) {
    console.error("Failed to read tasks", error);
    return [];
  }
}

function writeTasks(tasks: TaskItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to write tasks", error);
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => readTasks());

  useEffect(() => {
    writeTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((input: TaskInput) => {
    const trimmed = input.title.trim();
    if (!trimmed) return;
    setTasks((prev) => {
      const nextOrder = prev.length ? Math.min(...prev.map((task) => task.order ?? 0)) - 1 : 0;
      const task: TaskItem = {
        id: createEventId(),
        title: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
        dayKey: input.dayKey,
        dueDate: input.dueDate,
        order: nextOrder,
      };
      return normalizeOrder([task, ...prev]);
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<TaskItem, "id" | "createdAt">>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  }, []);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((prev) => {
      if (!orderedIds.length) return prev;
      const lookup = new Map(prev.map((task) => [task.id, task] as const));
      const reordered: TaskItem[] = [];

      orderedIds.forEach((id, index) => {
        const existing = lookup.get(id);
        if (existing) {
          reordered.push({ ...existing, order: index });
          lookup.delete(id);
        }
      });

      const remaining = Array.from(lookup.values()).map((task, index) => ({
        ...task,
        order: orderedIds.length + index,
      }));

      return [...reordered, ...remaining];
    });
  }, []);

  const replaceAll = useCallback((next: TaskItem[]) => {
    setTasks(normalizeOrder(next));
  }, []);

  const mergeTasks = useCallback((incoming: TaskItem[]) => {
    if (!incoming.length) return;
    setTasks((prev) => {
      const map = new Map<string, TaskItem>();
      normalizeOrder(prev).forEach((task) => map.set(task.id, task));
      normalizeOrder(incoming).forEach((task) => map.set(task.id, task));
      return normalizeOrder(Array.from(map.values()));
    });
  }, []);

  const exportTasks = useCallback(() => JSON.stringify(tasks, null, 2), [tasks]);

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    updateTask,
    reorderTasks,
    replaceAll,
    mergeTasks,
    exportTasks,
    sanitizeTasks,
  } as const;
}
