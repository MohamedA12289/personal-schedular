"use client";

import { useCallback, useEffect, useState } from "react";

import { createEventId } from "@/app/hooks/use-events";
import type { TaskItem } from "@/app/types/task";

const STORAGE_KEY = "my-schedule-tasks";

function readTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((task): task is TaskItem => typeof task?.id === "string" && typeof task?.title === "string");
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

  const addTask = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: TaskItem = {
      id: createEventId(),
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  return { tasks, addTask, toggleTask, deleteTask } as const;
}
