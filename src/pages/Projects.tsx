import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Users, Archive, RotateCcw, GripVertical } from "lucide-react";
import { Project, ProjectTask, TaskStatus, ProjectStatus } from "../types";
import { format, parseISO } from "date-fns";
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

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-indigo-900/40 text-indigo-300",
  completed: "bg-emerald-900/40 text-emerald-300",
  "on-hold": "bg-amber-900/40 text-amber-300",
};

const blankProject = (): Omit<Project, "id" | "createdAt" | "tasks"> => ({
  name: "", courseId: "", description: "", members: [], deadline: "", status: "active",
});

export default function Projects() {
  const { projects, courses, addProject, updateProject, addProjectTask, updateProjectTask, deleteProjectTask, archiveProject, unarchiveProject } = useStore();
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get("view") === "archived" ? "archived" : "active";
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">(initialView);
  const [modal, setModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(blankProject());
  const [memberInput, setMemberInput] = useState("");
  const [taskForm, setTaskForm] = useState<Omit<ProjectTask, "id">>({ title: "", status: "todo", assignedTo: "", dueDate: "" });
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const selectedProject = projects.find(p => p.id === selected);
  const visibleProjects = useMemo(
    () => projects.filter(p => (view === "archived" ? !!p.archivedAt : !p.archivedAt)),
    [projects, view]
  );
  const getCourse = (id?: string) => courses.find(c => c.id === id);

  useEffect(() => {
    if (!selectedProject) return;
    if (view === "active" && selectedProject.archivedAt) setSelected(null);
    if (view === "archived" && !selectedProject.archivedAt) setSelected(null);
  }, [view, selectedProject]);

  const openAdd = () => { setEditing(null); setForm(blankProject()); setMemberInput(""); setModal(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, courseId: p.courseId ?? "", description: p.description, members: [...p.members], deadline: p.deadline ?? "", status: p.status });
    setMemberInput("");
    setModal(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateProject(editing.id, form);
    else { addProject(form); }
    setModal(false);
  };

  const addMember = () => {
    const m = memberInput.trim();
    if (m && !form.members.includes(m)) setForm(p => ({ ...p, members: [...p.members, m] }));
    setMemberInput("");
  };

  const openAddTask = () => {
    setEditingTask(null);
    setTaskForm({ title: "", status: "todo", assignedTo: "", dueDate: "" });
    setTaskModal(true);
  };

  const openEditTask = (t: ProjectTask) => {
    setEditingTask(t);
    setTaskForm({ title: t.title, status: t.status, assignedTo: t.assignedTo ?? "", dueDate: t.dueDate ?? "" });
    setTaskModal(true);
  };

  const saveTask = () => {
    if (!selected || !taskForm.title.trim()) return;
    if (editingTask) updateProjectTask(selected, editingTask.id, taskForm);
    else addProjectTask(selected, taskForm);
    setTaskModal(false);
  };

  const progress = (p: Project) => {
    if (!p.tasks.length) return 0;
    return Math.round((p.tasks.filter(t => t.status === "done").length / p.tasks.length) * 100);
  };

  // ── dnd-kit handlers ─────────────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => setDraggingTaskId(e.active.id as string);
  const handleDragOver  = (e: DragOverEvent)  => setOverStatus((e.over?.id as TaskStatus) ?? null);
  const handleDragEnd   = (e: DragEndEvent)   => {
    const { active, over } = e;
    if (over && selected) {
      const task = selectedProject?.tasks.find(t => t.id === active.id);
      if (task && task.status !== over.id)
        updateProjectTask(selected, active.id as string, { status: over.id as TaskStatus });
    }
    setDraggingTaskId(null);
    setOverStatus(null);
  };

  const colMeta: Record<TaskStatus, { label: string; borderColor: string; activeColor: string }> = {
    "todo":        { label: "To Do",       borderColor: "border-slate-600",  activeColor: "border-slate-400 bg-slate-800/20" },
    "in-progress": { label: "In Progress", borderColor: "border-indigo-500", activeColor: "border-indigo-400 bg-indigo-900/20" },
    "done":        { label: "Done",        borderColor: "border-emerald-500", activeColor: "border-emerald-400 bg-emerald-900/20" },
  };

  const draggingTask = selectedProject?.tasks.find(t => t.id === draggingTaskId);

  return (
    <div className="flex h-full">
      {/* Project List */}
        <div className="w-72 shrink-0 border-r border-[var(--border-2)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-2)] flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-[var(--text-strong)]">Projects</h1>
              <div className="flex border border-[var(--border)] rounded-lg overflow-hidden mt-2 w-fit">
                {([["active", "Active"], ["archived", "Archived"]] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setView(val)}
                    className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${view === val ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={openAdd} className="btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs">
              <Plus size={12} /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleProjects.length === 0 && (
              <p className="text-[var(--text-faint)] text-xs text-center py-8">
                {view === "archived" ? "No archived projects." : "No projects yet."}
              </p>
            )}
            {visibleProjects.map(p => {
              const prog = progress(p);
              const course = getCourse(p.courseId);
              return (
                <div
                  key={p.id}
                onClick={() => setSelected(p.id)}
                className={`p-4 border-b border-[var(--border-2)] cursor-pointer hover:bg-[var(--surface-3)] transition-colors ${selected === p.id ? "bg-[var(--surface-3)] border-l-2 border-l-indigo-500" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-[var(--text-strong)]">{p.name}</p>
                  <span className={`badge text-[10px] ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                </div>
                {course && <p className="text-xs text-[var(--text-faint)] mt-0.5">{course.code}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-[var(--border-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${prog}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-faint)]">{prog}%</span>
                </div>
                {p.deadline && <p className="text-[10px] text-[var(--text-faint)] mt-1">Due {format(parseISO(p.deadline), "MMM d")}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedProject ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-faint)]">
            <p>Select a project to view details</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-2)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-strong)]">{selectedProject.name}</h2>
                  <p className="text-[var(--text-muted)] text-sm mt-0.5">{selectedProject.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(selectedProject)} className="btn-secondary py-1.5 px-2.5 flex items-center gap-1 text-xs">
                    <Edit2 size={12} /> Edit
                  </button>
                  {selectedProject.archivedAt ? (
                    <button
                      onClick={() => { unarchiveProject(selectedProject.id); setSelected(null); }}
                      className="btn-secondary py-1.5 px-2.5 flex items-center gap-1 text-xs"
                      title="Unarchive project"
                    >
                      <RotateCcw size={12} /> Unarchive
                    </button>
                  ) : (
                    <button
                      onClick={() => { archiveProject(selectedProject.id); setSelected(null); }}
                      className="btn-secondary py-1.5 px-2.5 flex items-center gap-1 text-xs"
                      title="Archive project"
                    >
                      <Archive size={12} /> Archive
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className={`badge ${STATUS_BADGE[selectedProject.status]}`}>{selectedProject.status}</span>
                {selectedProject.deadline && <span className="text-xs text-[var(--text-muted)]">Deadline: {format(parseISO(selectedProject.deadline), "MMM d, yyyy")}</span>}
                {selectedProject.members.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Users size={12} />
                    {selectedProject.members.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-strong)]">
                  Tasks ({selectedProject.tasks.filter(t => t.status === "done").length}/{selectedProject.tasks.length})
                </h3>
                <button
                  onClick={openAddTask}
                  disabled={!!selectedProject.archivedAt}
                  className={`btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs ${selectedProject.archivedAt ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={selectedProject.archivedAt ? "Unarchive to add tasks" : undefined}
                >
                  <Plus size={12} /> Add Task
                </button>
              </div>

              {/* Kanban Board — dnd-kit */}
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-3 gap-4">
                  {(["todo", "in-progress", "done"] as TaskStatus[]).map(status => {
                    const colTasks = selectedProject.tasks.filter(t => t.status === status);
                    const isOver = overStatus === status;
                    const meta = colMeta[status];
                    return (
                      <ProjDropColumn
                        key={status}
                        id={status}
                        label={meta.label}
                        count={colTasks.length}
                        isOver={isOver}
                        activeColor={meta.activeColor}
                      >
                        {colTasks.map(t => (
                          <ProjDraggableCard
                            key={t.id}
                            task={t}
                            projectId={selectedProject.id}
                            archivedAt={selectedProject.archivedAt}
                            draggingId={draggingTaskId}
                            onEdit={openEditTask}
                            onDelete={(id) => deleteProjectTask(selectedProject.id, id)}
                            onToggle={(id, s) => updateProjectTask(selectedProject.id, id, { status: s })}
                          />
                        ))}
                      </ProjDropColumn>
                    );
                  })}
                </div>
                <DragOverlay>
                  {draggingTask && (
                    <div className="rotate-1 scale-105 shadow-2xl opacity-95 pointer-events-none">
                      <ProjTaskCardInner task={draggingTask} archivedAt={selectedProject.archivedAt} />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </>
        )}
      </div>

      {/* Project Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Project" : "New Project"}>
        <div className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">None</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ProjectStatus }))}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div><label className="label">Deadline</label><input type="date" className="input" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} /></div>
          <div>
            <label className="label">Team Members</label>
            <div className="flex gap-2 mb-2">
              <input className="input flex-1" value={memberInput} onChange={e => setMemberInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }} placeholder="Name + Enter" />
              <button onClick={addMember} className="btn-secondary px-3">Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.members.map(m => (
                <span key={m} className="badge bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] flex items-center gap-1">
                  {m} <button onClick={() => setForm(p => ({ ...p, members: p.members.filter(x => x !== m) }))} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Create"}</button>
          </div>
        </div>
      </Modal>

      {/* Task Modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title={editingTask ? "Edit Task" : "Add Task"} size="sm">
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={taskForm.status} onChange={e => setTaskForm(p => ({ ...p, status: e.target.value as TaskStatus }))}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
          </div>
          <div><label className="label">Assigned To</label><input className="input" value={taskForm.assignedTo} onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))} placeholder="Team member name" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setTaskModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveTask}>{editingTask ? "Save" : "Add"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Droppable column for project tasks ────────────────────────────────
function ProjDropColumn({
  id, label, count, isOver, activeColor, children,
}: {
  id: string; label: string; count: number;
  isOver: boolean; activeColor: string; children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition-colors duration-150 ${
        isOver ? `${activeColor} border` : "bg-[var(--surface-4)] border-[var(--border-2)]"
      }`}
    >
      <div className="p-3 border-b border-[var(--border-2)] flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">{label}</span>
        <span className="text-xs text-[var(--text-faint)]">{count}</span>
      </div>
      <div className="p-2 space-y-2 min-h-[120px]">
        {children}
        {count === 0 && (
          <div className={`text-center py-6 text-xs transition-colors ${isOver ? "text-[var(--text-muted)]" : "text-[var(--text-faint)]"}`}>
            {isOver ? "Drop here" : "Empty"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared inner card (used by draggable + overlay) ───────────────────
function ProjTaskCardInner({
  task, archivedAt, dragHandleProps = {}, isDragging = false,
  onEdit, onDelete, onToggle,
}: {
  task: ProjectTask;
  archivedAt?: string;
  dragHandleProps?: object;
  isDragging?: boolean;
  onEdit?: (t: ProjectTask) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className={`card group p-3 hover:border-indigo-600/30 transition-colors ${isDragging ? "opacity-40" : ""}`}>
      <div className="flex items-center gap-2">
        {!archivedAt && (
          <span
            {...dragHandleProps}
            className="text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={13} />
          </span>
        )}
        {onToggle && (
          <button onClick={() => onToggle(task.id, task.status === "done" ? "todo" : "done")}>
            {task.status === "done"
              ? <CheckCircle2 size={14} className="text-emerald-500" />
              : <Circle size={14} className="text-[var(--text-faint)] hover:text-indigo-400" />}
          </button>
        )}
        <p className={`text-sm flex-1 ${task.status === "done" ? "line-through text-[var(--text-faint)]" : "text-[var(--text)]"}`}>{task.title}</p>
        {(onEdit || onDelete) && (
          <div className="hidden group-hover:flex gap-1">
            {onEdit && <button onClick={() => onEdit(task)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Edit2 size={11} /></button>}
            {onDelete && <button onClick={() => onDelete(task.id)} className="text-red-600 hover:text-red-400"><Trash2 size={11} /></button>}
          </div>
        )}
      </div>
      {(task.assignedTo || task.dueDate) && (
        <div className="flex items-center gap-2 mt-1.5 pl-5">
          {task.assignedTo && <span className="text-[10px] text-[var(--text-faint)]">{task.assignedTo}</span>}
          {task.dueDate && <span className="text-[10px] text-[var(--text-faint)] ml-auto">{format(parseISO(task.dueDate), "MMM d")}</span>}
        </div>
      )}
    </div>
  );
}

// ── Draggable project task card ───────────────────────────────────────
function ProjDraggableCard({
  task, archivedAt, draggingId, onEdit, onDelete, onToggle,
}: {
  task: ProjectTask;
  projectId: string;
  archivedAt?: string;
  draggingId: string | null;
  onEdit: (t: ProjectTask) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, status: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: !!archivedAt,
  });
  const style: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4, zIndex: 50 }
    : {};

  return (
    <div ref={setNodeRef} style={style}>
      <ProjTaskCardInner
        task={task}
        archivedAt={archivedAt}
        dragHandleProps={archivedAt ? {} : { ...attributes, ...listeners }}
        isDragging={draggingId === task.id}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
      />
    </div>
  );
}
