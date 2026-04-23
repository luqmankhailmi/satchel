import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { Plus, Trash2, Search, Tag, Eye, Edit3 } from "lucide-react";
import { Note } from "../types";
import { format, parseISO } from "date-fns";

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|o|l|b|h|p|c])/gm, "")
    .replace(/(.+)/g, (m) => m.startsWith("<") ? m : `<p>${m}</p>`);
}

const blankNote = (): Omit<Note, "id" | "createdAt" | "updatedAt"> => ({
  title: "", content: "", courseId: "", tags: [],
});

export default function Notes() {
  const { notes, courses, addNote, updateNote, deleteNote } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState(blankNote());
  const [isNew, setIsNew] = useState(false);

  const filtered = useMemo(() =>
    notes.filter(n =>
      (!search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())) &&
      (!courseFilter || n.courseId === courseFilter)
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes, search, courseFilter]
  );

  const selectedNote = notes.find(n => n.id === selected);

  const startNew = () => {
    setIsNew(true);
    setSelected(null);
    setForm(blankNote());
    setPreview(false);
  };

  const selectNote = (n: Note) => {
    if (isNew && form.title) saveNew();
    setIsNew(false);
    setSelected(n.id);
    setForm({ title: n.title, content: n.content, courseId: n.courseId ?? "", tags: n.tags });
    setPreview(false);
  };

  const saveNew = () => {
    if (!form.title.trim()) return;
    addNote(form);
    setIsNew(false);
    setSelected(null);
  };

  const saveEdit = () => {
    if (!selected || !form.title.trim()) return;
    updateNote(selected, form);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm(p => ({ ...p, tags: [...p.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (t: string) => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }));

  const getCourse = (id?: string) => courses.find(c => c.id === id);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-[var(--border-2)] flex flex-col">
        <div className="p-3 border-b border-[var(--border-2)] space-y-2">
          <button onClick={startNew} className="btn-primary w-full flex items-center gap-2 justify-center text-xs py-2">
            <Plus size={13} /> New Note
          </button>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2.5 text-[var(--text-faint)]" />
            <input className="input pl-7 text-xs py-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." />
          </div>
          <select className="input text-xs py-1.5" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="">All courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-[var(--text-faint)] text-xs text-center py-8">No notes</p>}
          {filtered.map(n => {
            const course = getCourse(n.courseId);
            return (
              <div
                key={n.id}
                onClick={() => selectNote(n)}
                className={`p-3 border-b border-[var(--border-2)] cursor-pointer hover:bg-[var(--surface-3)] transition-colors ${selected === n.id ? "bg-[var(--surface-3)] border-l-2 border-l-indigo-500" : ""}`}
              >
                <p className="text-sm font-medium text-[var(--text-strong)] truncate">{n.title || "Untitled"}</p>
                <p className="text-xs text-[var(--text-faint)] truncate mt-0.5">{n.content.slice(0, 60)}</p>
                <div className="flex items-center gap-2 mt-1">
                  {course && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: course.color + "25", color: course.color }}>{course.code}</span>}
                  <span className="text-[10px] text-[var(--text-faint)] ml-auto">{format(parseISO(n.updatedAt), "MMM d")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isNew && !selected ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-faint)]">
            <div className="text-center">
              <Edit3 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Select a note or create a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border-2)]">
              <input
                className="flex-1 bg-transparent text-lg font-semibold text-[var(--text-strong)] outline-none placeholder-[var(--placeholder)]"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Note title..."
              />
              <div className="flex items-center gap-2">
                <select className="input text-xs py-1.5 w-36" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                  <option value="">No course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
                <button onClick={() => setPreview(!preview)} className={`btn-secondary py-1.5 px-2.5 flex items-center gap-1.5 text-xs ${preview ? "border-indigo-500 text-indigo-300" : ""}`}>
                  {preview ? <Edit3 size={12} /> : <Eye size={12} />}
                  {preview ? "Edit" : "Preview"}
                </button>
                <button onClick={isNew ? saveNew : saveEdit} className="btn-primary py-1.5 px-3 text-xs">Save</button>
                {selected && (
                  <button onClick={() => { deleteNote(selected); setSelected(null); }} className="btn-danger py-1.5 px-2.5 text-xs">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 px-6 py-2 border-b border-[var(--border-2)] flex-wrap">
              <Tag size={12} className="text-[var(--text-faint)]" />
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-indigo-900/30 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-indigo-500 hover:text-white">×</button>
                </span>
              ))}
              <input
                className="bg-transparent text-xs text-[var(--text-muted)] outline-none placeholder-[var(--placeholder)] w-24"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                placeholder="+ add tag"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {preview ? (
                <div
                  className="markdown-preview px-6 py-4 max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                />
              ) : (
                <textarea
                  className="w-full h-full bg-transparent text-[var(--text)] text-sm leading-relaxed resize-none outline-none px-6 py-4 font-mono placeholder-[var(--placeholder)]"
                  value={form.content}
                  onChange={e => {
                    setForm(p => ({ ...p, content: e.target.value }));
                    if (selected) updateNote(selected, { content: e.target.value });
                  }}
                  placeholder={"# Your Note\n\nStart typing with Markdown support...\n\n- Bullet points\n- **Bold**, *italic*\n- `inline code`\n\n## Heading 2\n\nParagraph text here."}
                  spellCheck={false}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
