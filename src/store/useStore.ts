import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import {
  Course, Task, CalendarEvent, Note, TimetableSlot,
  Project, ProjectTask, ExamPaper, Resource, Grade, JournalEntry
} from "../types";

interface AppState {
  courses: Course[];
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  timetable: TimetableSlot[];
  projects: Project[];
  examPapers: ExamPaper[];
  resources: Resource[];
  grades: Grade[];
  journal: Record<string, JournalEntry>; // key: YYYY-MM-DD

  // Courses
  addCourse: (c: Omit<Course, "id" | "createdAt">) => void;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Tasks
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, t: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  // Events
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, e: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Notes
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, n: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Timetable
  addSlot: (s: Omit<TimetableSlot, "id">) => void;
  updateSlot: (id: string, s: Partial<TimetableSlot>) => void;
  deleteSlot: (id: string) => void;

  // Projects
  addProject: (p: Omit<Project, "id" | "createdAt" | "tasks">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectTask: (projectId: string, t: Omit<ProjectTask, "id">) => void;
  updateProjectTask: (projectId: string, taskId: string, t: Partial<ProjectTask>) => void;
  deleteProjectTask: (projectId: string, taskId: string) => void;

  // Exam Papers
  addExamPaper: (p: Omit<ExamPaper, "id" | "uploadedAt">) => void;
  updateExamPaper: (id: string, p: Partial<ExamPaper>) => void;
  deleteExamPaper: (id: string) => void;

  // Resources
  addResource: (r: Omit<Resource, "id" | "createdAt">) => void;
  updateResource: (id: string, r: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  // Grades
  addGrade: (g: Omit<Grade, "id">) => void;
  updateGrade: (id: string, g: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;

  // Journal (one entry per day)
  upsertJournalEntry: (date: string, entry: Partial<Omit<JournalEntry, "date" | "createdAt" | "updatedAt">> & { mood?: JournalEntry["mood"] }) => void;
  deleteJournalEntry: (date: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      courses: [],
      tasks: [],
      events: [],
      notes: [],
      timetable: [],
      projects: [],
      examPapers: [],
      resources: [],
      grades: [],
      journal: {},

      // Courses
      addCourse: (c) =>
        set((s) => ({ courses: [...s.courses, { ...c, id: uuid(), createdAt: new Date().toISOString() }] })),
      updateCourse: (id, c) =>
        set((s) => ({ courses: s.courses.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCourse: (id) =>
        set((s) => ({ courses: s.courses.filter((x) => x.id !== id) })),

      // Tasks
      addTask: (t) =>
        set((s) => ({ tasks: [...s.tasks, { ...t, id: uuid(), createdAt: new Date().toISOString() }] })),
      updateTask: (id, t) =>
        set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
      completeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === id ? { ...x, status: "done", completedAt: new Date().toISOString() } : x
          ),
        })),

      // Events
      addEvent: (e) =>
        set((s) => ({ events: [...s.events, { ...e, id: uuid() }] })),
      updateEvent: (id, e) =>
        set((s) => ({ events: s.events.map((x) => (x.id === id ? { ...x, ...e } : x)) })),
      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((x) => x.id !== id) })),

      // Notes
      addNote: (n) =>
        set((s) => ({
          notes: [...s.notes, { ...n, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        })),
      updateNote: (id, n) =>
        set((s) => ({
          notes: s.notes.map((x) => (x.id === id ? { ...x, ...n, updatedAt: new Date().toISOString() } : x)),
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((x) => x.id !== id) })),

      // Timetable
      addSlot: (s_) =>
        set((s) => ({ timetable: [...s.timetable, { ...s_, id: uuid() }] })),
      updateSlot: (id, s_) =>
        set((s) => ({ timetable: s.timetable.map((x) => (x.id === id ? { ...x, ...s_ } : x)) })),
      deleteSlot: (id) =>
        set((s) => ({ timetable: s.timetable.filter((x) => x.id !== id) })),

      // Projects
      addProject: (p) =>
        set((s) => ({
          projects: [...s.projects, { ...p, id: uuid(), tasks: [], createdAt: new Date().toISOString() }],
        })),
      updateProject: (id, p) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),
      addProjectTask: (projectId, t) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, tasks: [...p.tasks, { ...t, id: uuid() }] } : p
          ),
        })),
      updateProjectTask: (projectId, taskId, t) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: p.tasks.map((x) => (x.id === taskId ? { ...x, ...t } : x)) }
              : p
          ),
        })),
      deleteProjectTask: (projectId, taskId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, tasks: p.tasks.filter((x) => x.id !== taskId) } : p
          ),
        })),

      // Exam Papers
      addExamPaper: (p) =>
        set((s) => ({ examPapers: [...s.examPapers, { ...p, id: uuid(), uploadedAt: new Date().toISOString() }] })),
      updateExamPaper: (id, p) =>
        set((s) => ({ examPapers: s.examPapers.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteExamPaper: (id) =>
        set((s) => ({ examPapers: s.examPapers.filter((x) => x.id !== id) })),

      // Resources
      addResource: (r) =>
        set((s) => ({ resources: [...s.resources, { ...r, id: uuid(), createdAt: new Date().toISOString() }] })),
      updateResource: (id, r) =>
        set((s) => ({ resources: s.resources.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
      deleteResource: (id) =>
        set((s) => ({ resources: s.resources.filter((x) => x.id !== id) })),

      // Grades
      addGrade: (g) =>
        set((s) => ({ grades: [...s.grades, { ...g, id: uuid() }] })),
      updateGrade: (id, g) =>
        set((s) => ({ grades: s.grades.map((x) => (x.id === id ? { ...x, ...g } : x)) })),
      deleteGrade: (id) =>
        set((s) => ({ grades: s.grades.filter((x) => x.id !== id) })),

      // Journal
      upsertJournalEntry: (date, entry) =>
        set((s) => {
          const existing = s.journal[date];
          const now = new Date().toISOString();
          const next: JournalEntry = {
            date,
            studied: entry.studied ?? existing?.studied ?? "",
            learned: entry.learned ?? existing?.learned ?? "",
            felt: entry.felt ?? existing?.felt ?? "",
            mood: entry.mood ?? existing?.mood,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          };
          return { journal: { ...s.journal, [date]: next } };
        }),
      deleteJournalEntry: (date) =>
        set((s) => {
          if (!s.journal[date]) return s;
          const { [date]: _, ...rest } = s.journal;
          return { journal: rest };
        }),
    }),
    { name: "satchel-storage" }
  )
);
