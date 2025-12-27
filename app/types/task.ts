export type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  dayKey: string;
  dueDate?: string;
};
