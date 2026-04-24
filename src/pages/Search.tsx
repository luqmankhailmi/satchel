import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, BookOpen, Calendar, CheckSquare, FileText, FolderKanban, Link2, Search } from "lucide-react";
import { useStore } from "../store/useStore";

type ResultType = "task" | "note" | "course" | "project" | "exam" | "resource" | "event";

interface Result {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  path: string;
}

const TYPE_CONFIG: Record<ResultType, { icon: any; color: string; label: string; path: string }> = {
  task: { icon: CheckSquare, color: "text-indigo-400", label: "Task", path: "/tasks" },
  note: { icon: FileText, color: "text-sky-400", label: "Note", path: "/notes" },
  course: { icon: BookOpen, color: "text-amber-400", label: "Course", path: "/courses" },
  project: { icon: FolderKanban, color: "text-purple-400", label: "Project", path: "/projects" },
  exam: { icon: Archive, color: "text-red-400", label: "Exam Paper", path: "/exams" },
  resource: { icon: Link2, color: "text-emerald-400", label: "Resource", path: "/resources" },
  event: { icon: Calendar, color: "text-pink-400", label: "Event", path: "/calendar" },
};

export default function SearchPage() {
  const { tasks, notes, courses, projects, examPapers, resources, events } = useStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = useMemo((): Result[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();

    const taskResults = tasks
      .filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .map(t => ({
        id: t.id,
        type: "task" as ResultType,
        title: t.title,
        subtitle: t.archivedAt ? `Archived - ${t.description || t.status}` : (t.description || t.status),
        path: t.archivedAt ? "/tasks?filter=archived" : "/tasks",
      }));

    const noteResults = notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .map(n => ({ id: n.id, type: "note" as ResultType, title: n.title, subtitle: n.content.slice(0, 60), path: "/notes" }));

    const courseResults = courses
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q))
      .map(c => ({ id: c.id, type: "course" as ResultType, title: `${c.code} – ${c.name}`, subtitle: c.instructor, path: "/courses" }));

    const projectResults = projects
      .filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .map(p => ({
        id: p.id,
        type: "project" as ResultType,
        title: p.name,
        subtitle: p.archivedAt ? `Archived - ${p.description}` : p.description,
        path: p.archivedAt ? "/projects?view=archived" : "/projects",
      }));

    const examResults = examPapers
      .filter(p => {
        const course = courses.find(c => c.id === p.courseId);
        return course?.name.toLowerCase().includes(q) || course?.code.toLowerCase().includes(q) || p.year.includes(q) || p.notes?.toLowerCase().includes(q);
      })
      .map(p => {
        const course = courses.find(c => c.id === p.courseId);
        return { id: p.id, type: "exam" as ResultType, title: `${course?.code ?? "?"} – ${p.year} ${p.semester}`, subtitle: p.notes, path: "/exams" };
      });

    const resourceResults = resources
      .filter(r => r.title.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q) || r.tags.some(t => t.includes(q)))
      .map(r => ({ id: r.id, type: "resource" as ResultType, title: r.title, subtitle: r.url ?? r.fileName ?? (r.filePath ? "Local file" : ""), path: "/resources" }));

    const eventResults = events
      .filter(e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
      .map(e => ({ id: e.id, type: "event" as ResultType, title: e.title, subtitle: `${e.date}${e.startTime ? ` at ${e.startTime}` : ""}`, path: "/calendar" }));

    return [...taskResults, ...noteResults, ...courseResults, ...projectResults, ...examResults, ...resourceResults, ...eventResults];
  }, [query, tasks, notes, courses, projects, examPapers, resources, events]);

  const grouped = useMemo(() => {
    const g: Partial<Record<ResultType, Result[]>> = {};
    results.forEach(r => { (g[r.type] ??= []).push(r); });
    return g;
  }, [results]);

  const types = Object.keys(grouped) as ResultType[];

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-strong)] mb-5">Search</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-3.5 text-[var(--text-muted)]" />
        <input
          autoFocus
          className="input pl-11 py-3 text-base rounded-xl"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tasks, notes, courses, projects, resources..."
        />
      </div>

      {/* Results */}
      {query.length >= 2 && results.length === 0 && (
        <div className="text-center py-12 text-[var(--text-faint)]">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p>No results found for "<span className="text-[var(--text-muted)]">{query}</span>"</p>
        </div>
      )}

      {query.length >= 2 && results.length > 0 && (
        <div className="space-y-5">
          <p className="text-xs text-[var(--text-faint)]">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {types.map(type => {
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className={config.color} />
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{config.label}s</span>
                  <span className="text-xs text-[var(--text-faint)]">({grouped[type]!.length})</span>
                </div>
                <div className="space-y-1.5">
                  {grouped[type]!.map(r => (
                    <button
                      key={r.id}
                      onClick={() => navigate(r.path)}
                      className="w-full text-left card hover:border-indigo-600/30 hover:bg-[var(--surface-3)] transition-colors flex items-start gap-3"
                    >
                      <Icon size={15} className={`${config.color} mt-0.5 shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-strong)] font-medium truncate">
                          {highlightMatch(r.title, query)}
                        </p>
                        {r.subtitle && (
                          <p className="text-xs text-[var(--text-faint)] truncate mt-0.5">{r.subtitle}</p>
                        )}
                      </div>
                      <span className={`badge ${TYPE_BADGE(type)} ml-auto shrink-0`}>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {query.length < 2 && (
        <div className="text-center py-12 text-[var(--text-faint)]">
          <Search size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Type at least 2 characters to search</p>
          <p className="text-xs mt-1">Searches tasks, notes, courses, projects, resources, events & exam papers</p>
        </div>
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string): string {
  return text; // In production you'd wrap matches in <mark> – returning plain for safety
}

function TYPE_BADGE(type: ResultType): string {
  const map: Record<ResultType, string> = {
    task: "bg-indigo-900/30 text-indigo-400",
    note: "bg-sky-900/30 text-sky-400",
    course: "bg-amber-900/30 text-amber-400",
    project: "bg-purple-900/30 text-purple-400",
    exam: "bg-red-900/30 text-red-400",
    resource: "bg-emerald-900/30 text-emerald-400",
    event: "bg-pink-900/30 text-pink-400",
  };
  return map[type];
}
