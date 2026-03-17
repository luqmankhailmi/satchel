import { useState } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2, ExternalLink, Archive } from "lucide-react";
import { ExamPaper } from "../types";
import { format, parseISO } from "date-fns";

const blank = (): Omit<ExamPaper, "id" | "uploadedAt"> => ({
  courseId: "", year: new Date().getFullYear().toString(), semester: "", url: "", notes: "",
});

export default function ExamPapers() {
  const { examPapers, courses, addExamPaper, updateExamPaper, deleteExamPaper } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ExamPaper | null>(null);
  const [form, setForm] = useState(blank());
  const [filterCourse, setFilterCourse] = useState("");

  const filtered = examPapers
    .filter(p => !filterCourse || p.courseId === filterCourse)
    .sort((a, b) => b.year.localeCompare(a.year));

  const grouped: Record<string, ExamPaper[]> = {};
  filtered.forEach(p => {
    const course = courses.find(c => c.id === p.courseId);
    const key = course ? `${course.code} – ${course.name}` : "Unknown Course";
    (grouped[key] ??= []).push(p);
  });

  const openAdd = () => { setEditing(null); setForm(blank()); setModal(true); };
  const openEdit = (p: ExamPaper) => {
    setEditing(p);
    setForm({ courseId: p.courseId, year: p.year, semester: p.semester, url: p.url ?? "", notes: p.notes ?? "" });
    setModal(true);
  };

  const save = () => {
    if (!form.courseId || !form.year) return;
    if (editing) updateExamPaper(editing.id, form);
    else addExamPaper(form);
    setModal(false);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Exam Papers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Store past exam papers and quick-access links</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-40" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Paper
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12 text-slate-600">Add courses first to store exam papers.</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-slate-600">
          <Archive size={40} className="mb-3 opacity-30" />
          <p>No exam papers stored yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([courseName, papers]) => {
            const course = courses.find(c => `${c.code} – ${c.name}` === courseName);
            return (
              <div key={courseName}>
                <div className="flex items-center gap-2 mb-3">
                  {course && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />}
                  <h2 className="text-sm font-semibold text-slate-300">{courseName}</h2>
                  <span className="text-xs text-slate-600">({papers.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {papers.map(p => (
                    <div key={p.id} className="card group hover:border-indigo-600/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-200">{p.year}</span>
                            {p.semester && <span className="badge bg-slate-800 text-slate-400">{p.semester}</span>}
                          </div>
                          {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                          <p className="text-[10px] text-slate-700 mt-1">Added {format(parseISO(p.uploadedAt), "MMM d, yyyy")}</p>
                        </div>
                        <div className="flex gap-1">
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-300 p-1">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button onClick={() => openEdit(p)} className="hidden group-hover:block text-slate-500 hover:text-slate-300 p-1"><Edit2 size={13} /></button>
                          <button onClick={() => deleteExamPaper(p.id)} className="hidden group-hover:block text-red-700 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      {p.url && (
                        <div className="mt-2 flex items-center gap-1">
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 truncate flex items-center gap-1">
                            <ExternalLink size={10} />
                            Open Paper
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Paper" : "Add Exam Paper"} size="sm">
        <div className="space-y-3">
          <div>
            <label className="label">Course *</label>
            <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Year *</label><input className="input" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="2024" /></div>
            <div><label className="label">Semester</label><input className="input" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} placeholder="Sem 1" /></div>
          </div>
          <div><label className="label">URL / Link</label><input className="input" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." /></div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Final exam, closed book" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add Paper"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
