import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Clock } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "../types";
import { format, parseISO, isBefore, startOfDay } from "date-fns";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-slate-800 text-slate-400",
  medium: "bg-amber-900/40 text-amber-300",
  high: "bg-red-900/40 text-red-300",
};

const blank = (): Omit<Task, "id" | "createdAt"> => ({
  title: "", description: "", courseId: "", dueDate: "",
  priority: "medium", status: "todo",
});

export default function Tasks() {
  const { tasks, courses, addTask, updateTask, deleteTask, completeTask } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(blank());
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [courseFilter, setCourseFilter] = useState("");

  const filtered = useMemo(() =>
    tasks.filter(t =>
      (filter === "all" || t.status === filter) &&
      (!courseFilter || t.courseId === courseFilter)
    ).sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    }), [tasks, filter, courseFilter]);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: "todo", label: "To Do", color: "border-slate-600" },
    { id: "in-progress", label: "In Progress", color: "border-indigo-500" },
    { id: "done", label: "Done", color: "border-emerald-500" },
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

  const isOverdue = (t: Task) =>
    t.status !== "done" && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()));

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tasks.filter(t => t.status !== "done").length} pending · {tasks.filter(t => t.status === "done").length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <div className="flex border border-[#1e2640] rounded-lg overflow-hidden">
            {([["all", "All"], ["todo", "Todo"], ["in-progress", "Active"], ["done", "Done"]] as const).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === val ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
              >{lbl}</button>
            ))}
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Task
          </button>
        </div>
      </div>

      {filter === "all" ? (
        /* Kanban Board */
        <div className="flex gap-4 flex-1 overflow-x-auto">
          {columns.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`flex-1 min-w-[260px] bg-[#0d1120] rounded-xl border-t-2 ${col.color} flex flex-col`}>
                <div className="p-3 flex items-center justify-between border-b border-[#1a2035]">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{col.label}</span>
                  <span className="text-xs text-slate-600 bg-[#1a2035] rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colTasks.map(t => <TaskCard key={t.id} task={t} getCourse={getCourse} isOverdue={isOverdue} onEdit={openEdit} onDelete={deleteTask} onComplete={completeTask} onStatus={(id, status) => updateTask(id, { status })} />)}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-700 text-xs">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 flex-1 overflow-y-auto">
          {filtered.map(t => <TaskCard key={t.id} task={t} getCourse={getCourse} isOverdue={isOverdue} onEdit={openEdit} onDelete={deleteTask} onComplete={completeTask} onStatus={(id, status) => updateTask(id, { status })} />)}
          {filtered.length === 0 && <p className="text-slate-600 text-sm text-center py-16">No tasks found.</p>}
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

function TaskCard({ task, getCourse, isOverdue, onEdit, onDelete, onComplete, onStatus }: {
  task: Task;
  getCourse: (id?: string) => any;
  isOverdue: (t: Task) => boolean | "" | undefined;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onStatus: (id: string, status: TaskStatus) => void;
}) {
  const course = getCourse(task.courseId);
  const overdue = isOverdue(task);

  return (
    <div className={`card group flex flex-col gap-2 hover:border-indigo-600/30 transition-colors ${overdue ? "border-red-900/40" : ""}`}>
      <div className="flex items-start gap-2">
        <button onClick={() => task.status === "done" ? onStatus(task.id, "todo") : onComplete(task.id)} className="mt-0.5 shrink-0">
          {task.status === "done"
            ? <CheckCircle2 size={16} className="text-emerald-500" />
            : <Circle size={16} className="text-slate-600 hover:text-indigo-400 transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-slate-600" : "text-slate-200"}`}>{task.title}</p>
          {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
        </div>
        <div className="hidden group-hover:flex gap-1">
          <button onClick={() => onEdit(task)} className="text-slate-500 hover:text-slate-300 p-1"><Edit2 size={12} /></button>
          <button onClick={() => onDelete(task.id)} className="text-red-600 hover:text-red-400 p-1"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
        {course && (
          <span className="badge text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: course.color + "25", color: course.color }}>
            {course.code}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-[10px] ml-auto ${overdue ? "text-red-400" : "text-slate-600"}`}>
            <Clock size={10} />
            {format(parseISO(task.dueDate), "MMM d")}
            {overdue && " (overdue)"}
          </span>
        )}
      </div>
    </div>
  );
}
