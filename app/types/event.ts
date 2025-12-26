export type EventCategory = "School" | "Work" | "Business" | "Personal" | "Other";

export type EventItem = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end?: string;
  allDay?: boolean;
  notes?: string;
  category?: EventCategory;
  reminderMinutesBefore?: number;
};

export type EventInput = Omit<EventItem, "id">;
