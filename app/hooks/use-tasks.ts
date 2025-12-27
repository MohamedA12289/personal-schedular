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

function readTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((task): task is TaskItem => typeof task?.id === "string" && typeof task?.title === "string")
      .map((task) => ({
        ...task,
        dayKey: typeof task.dayKey === "string" && task.dayKey ? task.dayKey : localDayKey(new Date(task.createdAt ?? Date.now())),
      }));
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
    const task: TaskItem = {
      id: createEventId(),
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      dayKey: input.dayKey,
      dueDate: input.dueDate,
    };
    setTasks((prev) => [task, ...prev]);
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

  return { tasks, addTask, toggleTask, deleteTask, clearCompleted, updateTask } as const;
}
