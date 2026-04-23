import { useMemo, useState } from "react";
import { BookOpen, Edit2, ExternalLink, FileText, Link2, Package, Plus, Trash2, Upload, Video, Wrench } from "lucide-react";
import Modal from "../components/Modal";
import { useStore } from "../store/useStore";
import { Resource, ResourceType } from "../types";
import { openLocalFile, pickAndStoreLocalFile, removeManagedLocalFile } from "../utils/localFiles";

const TYPE_ICONS: Record<ResourceType, any> = {
  video: Video, article: FileText, book: BookOpen, paper: FileText, tool: Wrench, other: Package,
};
const TYPE_BADGE: Record<ResourceType, string> = {
  video: "bg-red-900/30 text-red-300",
  article: "bg-sky-900/30 text-sky-300",
  book: "bg-amber-900/30 text-amber-300",
  paper: "bg-purple-900/30 text-purple-300",
  tool: "bg-emerald-900/30 text-emerald-300",
  other: "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]",
};

const blank = (): Omit<Resource, "id" | "createdAt"> => ({
  title: "",
  url: "",
  filePath: "",
  fileName: "",
  courseId: "",
  type: "article",
  tags: [],
  notes: "",
});

export default function Resources() {
  const { resources, courses, addResource, updateResource, deleteResource } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(blank());
  const [tagInput, setTagInput] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "">("");
  const [search, setSearch] = useState("");
  const [originalFilePath, setOriginalFilePath] = useState<string>("");

  const filtered = useMemo(() =>
    resources.filter(r =>
      (!filterCourse || r.courseId === filterCourse) &&
      (!filterType || r.type === filterType) &&
      (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.notes?.toLowerCase().includes(search.toLowerCase()))
    ), [resources, filterCourse, filterType, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(blank());
    setTagInput("");
    setOriginalFilePath("");
    setModal(true);
  };
  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      url: r.url ?? "",
      filePath: r.filePath ?? "",
      fileName: r.fileName ?? "",
      courseId: r.courseId ?? "",
      type: r.type,
      tags: [...r.tags],
      notes: r.notes ?? "",
    });
    setTagInput("");
    setOriginalFilePath(r.filePath ?? "");
    setModal(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (!form.url?.trim() && !form.filePath?.trim()) return;
    if (editing) {
      updateResource(editing.id, form);
      if (originalFilePath && originalFilePath !== form.filePath) void removeManagedLocalFile(originalFilePath);
    } else {
      addResource(form);
    }
    setModal(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }));
    setTagInput("");
  };

  const getCourse = (id?: string) => courses.find(c => c.id === id);

  const grouped = useMemo(() => {
    const g: Record<string, Resource[]> = {};
    filtered.forEach(r => { (g[r.type] ??= []).push(r); });
    return g;
  }, [filtered]);

  const types = (["video", "article", "book", "paper", "tool", "other"] as ResourceType[]).filter(t => grouped[t]?.length);

  const linksCount = useMemo(() => resources.filter(r => !!r.url?.trim()).length, [resources]);
  const filesCount = useMemo(() => resources.filter(r => !!r.filePath?.trim()).length, [resources]);

  const uploadFile = async () => {
    try {
      const picked = await pickAndStoreLocalFile("resources");
      if (!picked) return;
      if (form.filePath && form.filePath !== originalFilePath && form.filePath !== picked.storedPath) {
        await removeManagedLocalFile(form.filePath);
      }
      setForm(p => ({ ...p, filePath: picked.storedPath, fileName: picked.originalName }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to upload file.");
    }
  };

  const removeFile = async () => {
    try {
      if (form.filePath && form.filePath !== originalFilePath) await removeManagedLocalFile(form.filePath);
    } catch {
      // best-effort
    } finally {
      setForm(p => ({ ...p, filePath: "", fileName: "" }));
    }
  };

  const openFile = async (path: string) => {
    try {
      await openLocalFile(path);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to open file.");
    }
  };

  const deleteResourceWithFile = async (r: Resource) => {
    try {
      await removeManagedLocalFile(r.filePath);
    } catch {
      // best-effort
    }
    deleteResource(r.id);
  };

  const closeModal = () => {
    void (async () => {
      try {
        if (form.filePath && form.filePath !== originalFilePath) await removeManagedLocalFile(form.filePath);
      } catch {
        // best-effort
      } finally {
        setModal(false);
      }
    })();
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-strong)]">Resources</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{resources.length} saved ({linksCount} links, {filesCount} files)</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input className="input w-48 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-36 text-sm" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
          <button onClick={() => setFilterType("")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterType === "" ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}>All</button>
          {(["video", "article", "book", "paper", "tool", "other"] as ResourceType[]).map(t => {
            const Icon = TYPE_ICONS[t];
            return (
              <button key={t} onClick={() => setFilterType(t === filterType ? "" : t)} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${filterType === t ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"}`}>
                <Icon size={11} /> {t}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-[var(--text-faint)]">
          <Link2 size={40} className="mb-3 opacity-30" />
          <p>No resources saved. Add links or upload files (books, articles, videos & more).</p>
        </div>
      ) : (
        <div className="space-y-6">
          {types.map(type => {
            const Icon = TYPE_ICONS[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} className="text-[var(--text-muted)]" />
                  <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{type}s</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {grouped[type].map(r => {
                    const course = getCourse(r.courseId);
                    const hasUrl = !!r.url?.trim();
                    const hasFile = !!r.filePath?.trim();

                    return (
                      <div key={r.id} className="card group hover:border-indigo-600/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasUrl ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-medium text-[var(--text-strong)] hover:text-indigo-300 transition-colors flex items-center gap-1 truncate">
                                  {r.title}
                                  <ExternalLink size={11} className="shrink-0 text-[var(--text-faint)]" />
                                </a>
                              ) : hasFile ? (
                                <button
                                  onClick={() => void openFile(r.filePath!)}
                                  className="text-sm font-medium text-[var(--text-strong)] hover:text-indigo-300 transition-colors flex items-center gap-1 truncate text-left"
                                  title={r.fileName ?? "Open file"}
                                >
                                  {r.title}
                                  <FileText size={11} className="shrink-0 text-[var(--text-faint)]" />
                                </button>
                              ) : (
                                <span className="text-sm font-medium text-[var(--text-strong)] truncate">{r.title}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`badge ${TYPE_BADGE[r.type]}`}>{r.type}</span>
                              {course && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: course.color + "20", color: course.color }}>{course.code}</span>}
                              {r.tags.map(t => <span key={t} className="badge bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-[10px]">#{t}</span>)}
                            </div>
                            {r.notes && <p className="text-xs text-[var(--text-faint)] mt-1">{r.notes}</p>}
                            {hasFile && (
                              <p className="text-[10px] text-[var(--text-faint)] mt-1 truncate" title={r.fileName || r.filePath}>
                                File: {r.fileName || r.filePath}
                              </p>
                            )}
                          </div>
                          <div className="hidden group-hover:flex gap-1 shrink-0">
                            <button onClick={() => openEdit(r)} className="text-[var(--text-faint)] hover:text-[var(--text-strong)] p-1"><Edit2 size={12} /></button>
                            <button onClick={() => void deleteResourceWithFile(r)} className="text-red-700 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing ? "Edit Resource" : "Add Resource"}>
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Resource title" /></div>

          <div>
            <label className="label">URL</label>
            <input className="input" value={form.url ?? ""} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            <p className="text-[10px] text-[var(--text-faint)] mt-1">Provide either a URL or an uploaded file.</p>
          </div>

          <div>
            <label className="label">Upload File</label>
            <div className="flex items-center gap-2">
              <button onClick={() => void uploadFile()} className="btn-secondary flex items-center gap-2">
                <Upload size={14} /> Choose file
              </button>
              {form.filePath ? (
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-muted)] truncate" title={form.fileName || form.filePath}>
                    {form.fileName || form.filePath}
                  </span>
                  <button onClick={() => void removeFile()} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                </div>
              ) : (
                <span className="text-xs text-[var(--text-faint)]">Optional (PDF, docs, images, etc.)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ResourceType }))}>
                {(["video", "article", "book", "paper", "tool", "other"] as ResourceType[]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">None</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2 mb-1">
              <input className="input flex-1" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} placeholder="tag + Enter" />
            </div>
            <div className="flex flex-wrap gap-1">
              {form.tags.map(t => (
                <span key={t} className="badge bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] flex items-center gap-1">
                  {t}
                  <button onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} className="text-[var(--text-faint)] hover:text-[var(--text-strong)]">×</button>
                </span>
              ))}
            </div>
          </div>

          <div><label className="label">Notes</label><input className="input" value={form.notes ?? ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
