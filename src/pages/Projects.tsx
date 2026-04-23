import { useState } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Users } from "lucide-react";
import { Project, ProjectTask, TaskStatus, ProjectStatus } from "../types";
import { format, parseISO } from "date-fns";

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-indigo-900/40 text-indigo-300",
  completed: "bg-emerald-900/40 text-emerald-300",
  "on-hold": "bg-amber-900/40 text-amber-300",
};

const blankProject = (): Omit<Project, "id" | "createdAt" | "tasks"> => ({
  name: "", courseId: "", description: "", members: [], deadline: "", status: "active",
});

export default function Projects() {
  const { projects, courses, addProject, updateProject, deleteProject, addProjectTask, updateProjectTask, deleteProjectTask } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(blankProject());
  const [memberInput, setMemberInput] = useState("");
  const [taskForm, setTaskForm] = useState<Omit<ProjectTask, "id">>({ title: "", status: "todo", assignedTo: "", dueDate: "" });
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const selectedProject = projects.find(p => p.id === selected);
  const getCourse = (id?: string) => courses.find(c => c.id === id);

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

  return (
    <div className="flex h-full">
      {/* Project List */}
      <div className="w-72 shrink-0 border-r border-[var(--border-2)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-2)] flex items-center justify-between">
          <h1 className="text-base font-bold text-[var(--text-strong)]">Projects</h1>
          <button onClick={openAdd} className="btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 && <p className="text-[var(--text-faint)] text-xs text-center py-8">No projects yet.</p>}
          {projects.map(p => {
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
                  <button onClick={() => { deleteProject(selectedProject.id); setSelected(null); }} className="btn-danger py-1.5 px-2.5 text-xs">
                    <Trash2 size={12} />
                  </button>
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
                <button onClick={openAddTask} className="btn-primary py-1.5 px-2.5 flex items-center gap-1 text-xs">
                  <Plus size={12} /> Add Task
                </button>
              </div>

              {/* Columns */}
              <div className="grid grid-cols-3 gap-4">
                {(["todo", "in-progress", "done"] as TaskStatus[]).map(status => {
                  const colTasks = selectedProject.tasks.filter(t => t.status === status);
                  return (
                    <div key={status} className="bg-[var(--surface-4)] rounded-xl border border-[var(--border-2)]">
                      <div className="p-3 border-b border-[var(--border-2)] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">{status.replace("-", " ")}</span>
                        <span className="text-xs text-[var(--text-faint)]">{colTasks.length}</span>
                      </div>
                      <div className="p-2 space-y-2 min-h-[120px]">
                        {colTasks.map(t => (
                          <div key={t.id} className="card group p-3 hover:border-indigo-600/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateProjectTask(selectedProject.id, t.id, { status: t.status === "done" ? "todo" : "done" })}>
                                {t.status === "done"
                                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                                  : <Circle size={14} className="text-[var(--text-faint)] hover:text-indigo-400" />}
                              </button>
                              <p className={`text-sm flex-1 ${t.status === "done" ? "line-through text-[var(--text-faint)]" : "text-[var(--text)]"}`}>{t.title}</p>
                              <div className="hidden group-hover:flex gap-1">
                                <button onClick={() => openEditTask(t)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Edit2 size={11} /></button>
                                <button onClick={() => deleteProjectTask(selectedProject.id, t.id)} className="text-red-600 hover:text-red-400"><Trash2 size={11} /></button>
                              </div>
                            </div>
                            {(t.assignedTo || t.dueDate) && (
                              <div className="flex items-center gap-2 mt-1.5 pl-5">
                                {t.assignedTo && <span className="text-[10px] text-[var(--text-faint)]">{t.assignedTo}</span>}
                                {t.dueDate && <span className="text-[10px] text-[var(--text-faint)] ml-auto">{format(parseISO(t.dueDate), "MMM d")}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
