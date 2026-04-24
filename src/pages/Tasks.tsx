import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Edit2, CheckCircle2, Circle, Clock, Archive, RotateCcw, GripVertical } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "../types";
import { format, parseISO, isBefore, startOfDay } from "date-fns";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]",
  medium: "bg-amber-900/40 text-amber-300",
  high: "bg-red-900/40 text-red-300",
};

const blank = (): Omit<Task, "id" | "createdAt"> => ({
  title: "", description: "", courseId: "", dueDate: "",
  priority: "medium", status: "todo",
});

// ── Droppable Column ───────────────────────────────────────────────────
function DroppableColumn({
  id, label, color, activeColor, count, children, isOver,
}: {
  id: string; label: string; color: string; activeColor: string;
  count: number; children: React.ReactNode; isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[260px] rounded-xl border border-t-2 flex flex-col transition-colors duration-150 ${
        isOver ? `${activeColor}` : `${color} bg-[var(--surface-4)] border-[var(--border-2)]`
      }`}
    >
      <div className="p-3 flex items-center justify-between border-b border-[var(--border-2)]">
        <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">{label}</span>
        <span className="text-xs text-[var(--text-faint)] bg-[var(--border-2)] rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {children}
        {count === 0 && (
          <div className={`text-center py-8 text-xs transition-colors ${isOver ? "text-[var(--text-muted)]" : "text-[var(--text-faint)]"}`}>
            {isOver ? "Drop here" : "Empty"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable Task Card ────────────────────────────────────────────────
function DraggableTaskCard(props: TaskCardProps & { draggingId: string | null }) {
  const { task, draggingId } = props;
  const archived = !!task.archivedAt;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: archived,
  });

  const style: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4, zIndex: 50 }
    : {};

  const isDragging = draggingId === task.id;

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardInner
        {...props}
        dragHandleProps={archived ? {} : { ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

// ── Task Card Inner (shared between draggable + overlay) ──────────────
interface TaskCardProps {
  task: Task;
  getCourse: (id?: string) => any;
  isOverdue: (t: Task) => boolean | "" | undefined;
  onEdit: (t: Task) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onComplete: (id: string) => void;
  onStatus: (id: string, status: TaskStatus) => void;
}

function TaskCardInner({
  task, getCourse, isOverdue, onEdit, onArchive, onUnarchive, onComplete, onStatus,
  dragHandleProps = {}, isDragging = false,
}: TaskCardProps & { dragHandleProps?: object; isDragging?: boolean }) {
  const course = getCourse(task.courseId);
  const overdue = isOverdue(task);
  const archived = !!task.archivedAt;

  return (
    <div className={`card group flex flex-col gap-2 hover:border-indigo-600/30 transition-colors ${overdue ? "border-red-900/40" : ""} ${isDragging ? "opacity-40" : ""}`}>
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {!archived && (
          <span
            {...dragHandleProps}
            className="mt-0.5 shrink-0 text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </span>
        )}
        <button
          disabled={archived}
          onClick={() => task.status === "done" ? onStatus(task.id, "todo") : onComplete(task.id)}
          className={`mt-0.5 shrink-0 ${archived ? "opacity-50 cursor-not-allowed" : ""}`}
          title={archived ? "Archived" : undefined}
        >
          {task.status === "done"
            ? <CheckCircle2 size={16} className="text-emerald-500" />
            : <Circle size={16} className="text-[var(--text-faint)] hover:text-indigo-400 transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-[var(--text-faint)]" : "text-[var(--text-strong)]"}`}>{task.title}</p>
          {task.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{task.description}</p>}
        </div>
        <div className="hidden group-hover:flex gap-1">
          <button onClick={() => onEdit(task)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1"><Edit2 size={12} /></button>
          {archived ? (
            <button onClick={() => onUnarchive(task.id)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1" title="Unarchive">
              <RotateCcw size={12} />
            </button>
          ) : (
            <button onClick={() => onArchive(task.id)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1" title="Archive">
              <Archive size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
        {archived && <span className="badge bg-slate-800/40 text-slate-300">archived</span>}
        {course && (
          <span className="badge text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: course.color + "25", color: course.color }}>
            {course.code}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-[10px] ml-auto ${overdue ? "text-red-400" : "text-[var(--text-faint)]"}`}>
            <Clock size={10} />
            {format(parseISO(task.dueDate), "MMM d")}
            {overdue && " (overdue)"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function Tasks() {
  const { tasks, courses, addTask, updateTask, completeTask, archiveTask, unarchiveTask } = useStore();
  const [searchParams] = useSearchParams();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(blank());
  const initialFilter = searchParams.get("filter") === "archived" ? "archived" : "all";
  const [filter, setFilter] = useState<"all" | TaskStatus | "archived">(initialFilter);
  const [courseFilter, setCourseFilter] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTasks = useMemo(() => tasks.filter(t => !t.archivedAt), [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "archived") list = list.filter(t => !!t.archivedAt);
    else list = list.filter(t => !t.archivedAt && (filter === "all" || t.status === filter));
    if (courseFilter) list = list.filter(t => t.courseId === courseFilter);
    if (filter === "archived") return list.sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));
    return list.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  }, [tasks, filter, courseFilter]);

  const columns: { id: TaskStatus; label: string; color: string; activeColor: string }[] = [
    { id: "todo",        label: "To Do",       color: "border-slate-600",  activeColor: "border-slate-400 border bg-slate-800/20 border-[var(--border-2)]" },
    { id: "in-progress", label: "In Progress", color: "border-indigo-500", activeColor: "border-indigo-400 border bg-indigo-900/20 border-[var(--border-2)]" },
    { id: "done",        label: "Done",        color: "border-emerald-500", activeColor: "border-emerald-400 border bg-emerald-900/20 border-[var(--border-2)]" },
  ];

  const openAdd = () => { setEditing(null); setForm(blank()); setModal(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, courseId: t.courseId ?? "", dueDate: t.dueDate ?? "", priority: t.priority, status: t.status });
    setModal(true);
  };
  const save = () => {
    if (!form.title.trim()) return;
    if (editing) updateTask(editing.id, form);
    else addTask(form);
    setModal(false);
  };
  const getCourse = (id?: string) => courses.find(c => c.id === id);
  const isOverdue = (t: Task) => t.status !== "done" && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()));

  const handleDragStart = (e: DragStartEvent) => setDraggingId(e.active.id as string);
  const handleDragOver = (e: DragOverEvent) => setOverCol((e.over?.id as TaskStatus) ?? null);
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const task = tasks.find(t => t.id === active.id);
      if (task && task.status !== over.id) updateTask(active.id as string, { status: over.id as TaskStatus });
    }
    setDraggingId(null);
    setOverCol(null);
  };

  const draggingTask = tasks.find(t => t.id === draggingId);

  const cardProps = {
    getCourse, isOverdue,
    onEdit: openEdit,
    onArchive: archiveTask,
    onUnarchive: unarchiveTask,
    onComplete: completeTask,
    onStatus: (id: string, status: TaskStatus) => updateTask(id, { status }),
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-strong)]">Tasks</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {activeTasks.filter(t => t.status !== "done").length} pending · {activeTasks.filter(t => t.status === "done").length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
            {([["all", "All"], ["todo", "Todo"], ["in-progress", "Active"], ["done", "Done"], ["archived", "Archived"]] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === val ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}
              >{lbl}</button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Task
          </button>
        </div>
      </div>

      {filter === "all" ? (
        /* ── Kanban Board with DnD ── */
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 flex-1 overflow-x-auto">
            {columns.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <DroppableColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  color={col.color}
                  activeColor={col.activeColor}
                  count={colTasks.length}
                  isOver={overCol === col.id}
                >
                  {colTasks.map(t => (
                    <DraggableTaskCard key={t.id} task={t} draggingId={draggingId} {...cardProps} />
                  ))}
                </DroppableColumn>
              );
            })}
          </div>
          {/* Drag Overlay — renders a floating preview card */}
          <DragOverlay>
            {draggingTask && (
              <div className="rotate-1 scale-105 shadow-2xl opacity-95 pointer-events-none">
                <TaskCardInner task={draggingTask} {...cardProps} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* ── List View ── */
        <div className="space-y-2 flex-1 overflow-y-auto">
          {filtered.map(t => (
            <TaskCardInner key={t.id} task={t} {...cardProps} />
          ))}
          {filtered.length === 0 && <p className="text-[var(--text-faint)] text-sm text-center py-16">No tasks found.</p>}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Task" : "New Task"}>
        <div className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as TaskStatus }))}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">None</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add Task"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
