import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Course, Grade } from "../types";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

const blankCourse = (): Omit<Course, "id" | "createdAt"> => ({
  name: "", code: "", color: COLORS[0], credits: 3, instructor: "",
  description: "", semester: "", objectives: [],
});

export default function Courses() {
  const { courses, grades, tasks, notes, addCourse, updateCourse, deleteCourse, addGrade, updateGrade, deleteGrade } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(blankCourse());
  const [objInput, setObjInput] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gradeModal, setGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState<Omit<Grade, "id">>({ courseId: "", assessment: "", score: 0, maxScore: 100, weight: 10 });
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [activeCourseId, setActiveCourseId] = useState("");

  const openAdd = () => { setEditing(null); setForm(blankCourse()); setObjInput(""); setModal(true); };
  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, color: c.color, credits: c.credits, instructor: c.instructor, description: c.description, semester: c.semester, objectives: [...c.objectives] });
    setObjInput("");
    setModal(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editing) updateCourse(editing.id, form);
    else addCourse(form);
    setModal(false);
  };

  const addObj = () => {
    const o = objInput.trim();
    if (o) setForm(p => ({ ...p, objectives: [...p.objectives, o] }));
    setObjInput("");
  };

  const courseGrades = (id: string) => grades.filter(g => g.courseId === id);
  const computeGrade = (id: string) => {
    const cg = courseGrades(id);
    if (!cg.length) return null;
    const wScore = cg.reduce((a, g) => a + (g.score / g.maxScore) * g.weight, 0);
    const wTotal = cg.reduce((a, g) => a + g.weight, 0);
    return wTotal ? ((wScore / wTotal) * 100).toFixed(1) : null;
  };

  const openGradeAdd = (courseId: string) => {
    setActiveCourseId(courseId);
    setEditingGrade(null);
    setGradeForm({ courseId, assessment: "", score: 0, maxScore: 100, weight: 10 });
    setGradeModal(true);
  };
  const openGradeEdit = (g: Grade) => {
    setEditingGrade(g);
    setGradeForm({ courseId: g.courseId, assessment: g.assessment, score: g.score, maxScore: g.maxScore, weight: g.weight, date: g.date });
    setActiveCourseId(g.courseId);
    setGradeModal(true);
  };
  const saveGrade = () => {
    if (!gradeForm.assessment.trim()) return;
    if (editingGrade) updateGrade(editingGrade.id, gradeForm);
    else addGrade(gradeForm);
    setGradeModal(false);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-strong)]">Courses</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""} this semester</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Course
        </button>
      </div>

      {courses.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-[var(--text-faint)]">
          <BookOpen size={40} className="mb-3 opacity-30" />
          <p>No courses yet. Add your first one!</p>
        </div>
      )}

      <div className="space-y-3">
        {courses.map(c => {
          const isOpen = expanded === c.id;
          const cGrades = courseGrades(c.id);
          const grade = computeGrade(c.id);
          const cTasks = tasks.filter(t => !t.archivedAt && t.courseId === c.id && t.status !== "done").length;
          const cNotes = notes.filter(n => n.courseId === c.id).length;

          return (
            <div key={c.id} className="card overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-strong)]">{c.code}</span>
                    <span className="text-sm text-[var(--text-muted)]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.instructor && <span className="text-xs text-[var(--text-faint)]">{c.instructor}</span>}
                    {c.semester && <span className="text-xs text-[var(--text-faint)]">{c.semester}</span>}
                    <span className="text-xs text-[var(--text-faint)]">{c.credits} credits</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-faint)]">Tasks</p>
                    <p className="text-sm font-semibold text-[var(--text)]">{cTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-faint)]">Notes</p>
                    <p className="text-sm font-semibold text-[var(--text)]">{cNotes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-faint)]">Grade</p>
                    <p className="text-sm font-semibold" style={{ color: grade ? c.color : "#4a5568" }}>
                      {grade ? `${grade}%` : "—"}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="text-[var(--text-faint)] hover:text-[var(--text-strong)] p-1"><Edit2 size={13} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); }} className="text-red-700 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                  </div>
                  {isOpen ? <ChevronDown size={15} className="text-[var(--text-faint)]" /> : <ChevronRight size={15} className="text-[var(--text-faint)]" />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
                  {c.description && (
                    <div>
                      <p className="text-xs text-[var(--text-faint)] font-semibold uppercase mb-1">Description</p>
                      <p className="text-sm text-[var(--text-muted)]">{c.description}</p>
                    </div>
                  )}
                  {c.objectives.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--text-faint)] font-semibold uppercase mb-2">Learning Objectives</p>
                      <ul className="space-y-1">
                        {c.objectives.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                            <span className="text-indigo-500 mt-0.5">•</span> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Grade Tracker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[var(--text-faint)] font-semibold uppercase">Grade Tracker</p>
                      <button onClick={() => openGradeAdd(c.id)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <Plus size={11} /> Add Assessment
                      </button>
                    </div>
                    {cGrades.length === 0 ? (
                    <p className="text-[var(--text-faint)] text-xs">No grades yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cGrades.map(g => (
                          <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--text)]">{g.assessment}</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-[var(--text-muted)]">{g.score}/{g.maxScore}</span>
                              <span className="text-[var(--text-faint)] text-xs">{g.weight}% weight</span>
                              <span className="font-semibold" style={{ color: c.color }}>{((g.score / g.maxScore) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="hidden group-hover:flex gap-1">
                              <button onClick={() => openGradeEdit(g)} className="text-[var(--text-faint)] hover:text-[var(--text-strong)] p-1"><Edit2 size={11} /></button>
                              <button onClick={() => deleteGrade(g.id)} className="text-red-700 hover:text-red-400 p-1"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))}
                        {grade && (
                          <div className="flex justify-end pt-1">
                            <span className="text-sm font-bold" style={{ color: c.color }}>Overall: {grade}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Course Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Course" : "Add Course"} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Course Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Data Structures" /></div>
            <div><label className="label">Course Code *</label><input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. CS201" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Instructor</label><input className="input" value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))} /></div>
            <div><label className="label">Semester</label><input className="input" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} placeholder="e.g. Sem 1 2025" /></div>
            <div><label className="label">Credits</label><input type="number" className="input" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: +e.target.value }))} min={1} max={10} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(col => (
                <button key={col} onClick={() => setForm(p => ({ ...p, color: col }))} className={`w-7 h-7 rounded-full transition-transform ${form.color === col ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--surface-1)] scale-110" : ""}`} style={{ backgroundColor: col }} />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Learning Objectives</label>
            <div className="flex gap-2 mb-2">
              <input className="input flex-1" value={objInput} onChange={e => setObjInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addObj(); } }} placeholder="Objective + Enter" />
              <button onClick={addObj} className="btn-secondary px-3">Add</button>
            </div>
            <div className="space-y-1">
              {form.objectives.map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <span className="text-indigo-500">•</span>
                  <span className="flex-1">{o}</span>
                  <button onClick={() => setForm(p => ({ ...p, objectives: p.objectives.filter((_, j) => j !== i) }))} className="text-red-700 hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add Course"}</button>
          </div>
        </div>
      </Modal>

      {/* Grade Modal */}
      <Modal open={gradeModal} onClose={() => setGradeModal(false)} title={editingGrade ? "Edit Grade" : "Add Assessment"} size="sm">
        <div className="space-y-3">
          <div><label className="label">Assessment *</label><input className="input" value={gradeForm.assessment} onChange={e => setGradeForm(p => ({ ...p, assessment: e.target.value }))} placeholder="e.g. Midterm Exam" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Score</label><input type="number" className="input" value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: +e.target.value }))} /></div>
            <div><label className="label">Max Score</label><input type="number" className="input" value={gradeForm.maxScore} onChange={e => setGradeForm(p => ({ ...p, maxScore: +e.target.value }))} /></div>
            <div><label className="label">Weight (%)</label><input type="number" className="input" value={gradeForm.weight} onChange={e => setGradeForm(p => ({ ...p, weight: +e.target.value }))} /></div>
          </div>
          <div><label className="label">Date</label><input type="date" className="input" value={gradeForm.date ?? ""} onChange={e => setGradeForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setGradeModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveGrade}>{editingGrade ? "Save" : "Add"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
