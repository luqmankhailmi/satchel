export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  credits: number;
  instructor: string;
  description: string;
  semester: string;
  objectives: string[];
  createdAt: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type EventType = "event" | "exam" | "assignment" | "reminder" | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  type: EventType;
  courseId?: string;
  description?: string;
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  courseId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TimetableDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type SlotType = "Lecture" | "Tutorial" | "Lab" | "Other";

export interface TimetableSlot {
  id: string;
  day: TimetableDay;
  startTime: string;
  endTime: string;
  courseId: string;
  room?: string;
  type: SlotType;
}

export interface ProjectTask {
  id: string;
  title: string;
  assignedTo?: string;
  status: TaskStatus;
  dueDate?: string;
}

export type ProjectStatus = "active" | "completed" | "on-hold";

export interface Project {
  id: string;
  name: string;
  courseId?: string;
  description: string;
  members: string[];
  tasks: ProjectTask[];
  deadline?: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface ExamPaper {
  id: string;
  courseId: string;
  year: string;
  semester: string;
  filePath?: string;
  fileName?: string;
  url?: string;
  notes?: string;
  uploadedAt: string;
}

export type ResourceType = "video" | "article" | "book" | "paper" | "tool" | "other";

export interface Resource {
  id: string;
  title: string;
  url?: string;
  filePath?: string;
  fileName?: string;
  courseId?: string;
  type: ResourceType;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  courseId: string;
  assessment: string;
  score: number;
  maxScore: number;
  weight: number;
  date?: string;
}
