import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare, FileText, BookOpen, FolderKanban,
  Clock, TrendingUp, AlertTriangle, Calendar,
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO, isAfter, isBefore, addDays, startOfDay, subDays } from "date-fns";
import DailyJournalModal from "../components/DailyJournalModal";
import { JournalEntry } from "../types";

function activityBg(count: number) {
  return (
    count === 0 ? "bg-[var(--heat-0)]" :
    count === 1 ? "bg-[var(--heat-1)]" :
    count === 2 ? "bg-[var(--heat-2)]" :
    count === 3 ? "bg-[var(--heat-3)]" :
    "bg-[var(--heat-4)]"
  );
}

function moodMeta(mood?: JournalEntry["mood"]) {
  const m = mood ?? 3;
  if (m === 1) return { label: "Rough", bg: "bg-rose-600/70" };
  if (m === 2) return { label: "Low", bg: "bg-amber-600/70" };
  if (m === 3) return { label: "Neutral", bg: "bg-slate-500/60" };
  if (m === 4) return { label: "Good", bg: "bg-emerald-600/70" };
  return { label: "Great", bg: "bg-emerald-400" };
}

function JournalHeatmapCell(props: {
  date: string;
  activityCount: number;
  entry?: JournalEntry;
  onOpen: (date: string) => void;
}) {
  const { date, activityCount, entry, onOpen } = props;
  const bg = entry ? moodMeta(entry.mood).bg : activityBg(activityCount);
  const title = entry
    ? `${date}\nJournal: ${moodMeta(entry.mood).label}\n${activityCount} activities`
    : `${date}\n${activityCount} activities\n(Click to add journal)`;

  return (
    <button
      type="button"
      onClick={() => onOpen(date)}
      className={`w-3 h-3 rounded-sm ${bg} transition-colors hover:brightness-110 ${entry ? "ring-1 ring-white/10" : ""}`}
      title={title}
    />
  );
}

export default function Dashboard() {
  const { tasks, notes, courses, projects, events, grades, journal, upsertJournalEntry, deleteJournalEntry } = useStore();
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalDate, setJournalDate] = useState(todayKey);

  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status !== "done").length;
    const overdue = tasks.filter(t => t.status !== "done" && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(today))).length;
    const done = tasks.filter(t => t.status === "done").length;
    const total = tasks.length;
    return { pending, overdue, done, total, completion: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const upcoming = useMemo(() => {
    const next7 = addDays(today, 7);
    const taskEvents = tasks
      .filter(t => t.status !== "done" && t.dueDate && isAfter(parseISO(t.dueDate), startOfDay(today)) && isBefore(parseISO(t.dueDate), next7))
      .map(t => ({ id: t.id, title: t.title, date: t.dueDate!, type: "task" as const, courseId: t.courseId }));
    const calEvents = events
      .filter(e => isAfter(parseISO(e.date), startOfDay(today)) && isBefore(parseISO(e.date), next7))
      .map(e => ({ id: e.id, title: e.title, date: e.date, type: e.type, courseId: e.courseId }));
    return [...taskEvents, ...calEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  }, [tasks, events]);

  const todayEvents = useMemo(() =>
    events.filter(e => isToday(parseISO(e.date))), [events]);

  // Heatmap: last 16 weeks (112 days)
  const heatmap = useMemo(() => {
    const days: Record<string, number> = {};
    const start = subDays(today, 111);
    for (let i = 0; i < 112; i++) {
      const d = format(addDays(start, i), "yyyy-MM-dd");
      days[d] = 0;
    }
    tasks.forEach(t => {
      if (t.completedAt) {
        const d = t.completedAt.split("T")[0];
        if (days[d] !== undefined) days[d]++;
      }
    });
    notes.forEach(n => {
      const d = n.createdAt.split("T")[0];
      if (days[d] !== undefined) days[d]++;
    });
    events.forEach(e => {
      if (days[e.date] !== undefined) days[e.date]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date,
      activityCount: count,
      entry: journal[date],
    }));
  }, [tasks, notes, events, journal]);

  // GPA Estimate
  const gpa = useMemo(() => {
    if (!grades.length) return null;
    const weighted = grades.reduce((acc, g) => acc + (g.score / g.maxScore) * g.weight, 0);
    const totalWeight = grades.reduce((acc, g) => acc + g.weight, 0);
    if (!totalWeight) return null;
    return ((weighted / totalWeight) * 4).toFixed(2);
  }, [grades]);

  const getCourse = (id?: string) => courses.find(c => c.id === id);

  const dateLabel = (d: string) => {
    const parsed = parseISO(d);
    if (isToday(parsed)) return "Today";
    if (isTomorrow(parsed)) return "Tomorrow";
    return format(parsed, "MMM d");
  };

  // Build weeks for heatmap display
  const weeks: { date: string; activityCount: number; entry?: JournalEntry }[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  const openJournal = (date: string) => {
    setJournalDate(date);
    setJournalOpen(true);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">
            {format(today, "EEEE")}, <span className="text-indigo-400">{format(today, "MMMM d")}</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Here's what's on your plate today.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/tasks")} className="btn-secondary flex items-center gap-2">
            <CheckSquare size={14} /> Add Task
          </button>
          <button onClick={() => navigate("/calendar")} className="btn-primary flex items-center gap-2">
            <Calendar size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending Tasks", value: stats.pending, icon: CheckSquare, color: "text-indigo-400", bg: "bg-indigo-600/10 border-indigo-600/20" },
          { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-600/10 border-red-600/20" },
          { label: "Completion", value: `${stats.completion}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-600/10 border-emerald-600/20" },
          { label: "GPA (est.)", value: gpa ?? "—", icon: BookOpen, color: "text-amber-400", bg: "bg-amber-600/10 border-amber-600/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card border ${bg} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Upcoming */}
        <div className="col-span-2 card">
          <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-4 flex items-center gap-2">
            <Clock size={15} className="text-indigo-400" /> Upcoming (next 7 days)
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-[var(--text-faint)] text-sm py-4 text-center">Nothing coming up - you're free!</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(item => {
                const course = getCourse(item.courseId);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-indigo-600/30 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: course?.color ?? "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-strong)] truncate">{item.title}</p>
                      {course && <p className="text-xs text-[var(--text-faint)]">{course.code}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-muted)]">{dateLabel(item.date)}</span>
                      <span className={`ml-2 badge ${item.type === "task" ? "bg-indigo-900/40 text-indigo-300" : item.type === "exam" ? "bg-red-900/40 text-red-300" : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]"}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Today's Events */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-indigo-400" /> Today
            </h2>
            {todayEvents.length === 0 ? (
              <p className="text-[var(--text-faint)] text-xs">No events today.</p>
            ) : (
              <div className="space-y-1.5">
                {todayEvents.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="truncate">{e.title}</span>
                    {e.startTime && <span className="ml-auto text-[var(--text-faint)]">{e.startTime}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-3 flex items-center gap-2">
              <FolderKanban size={15} className="text-indigo-400" /> Overview
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "Courses", value: courses.length, path: "/courses" },
                { label: "Notes", value: notes.length, path: "/notes" },
                { label: "Projects", value: projects.filter(p => p.status === "active").length, path: "/projects" },
              ].map(({ label, value, path }) => (
                <div
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex justify-between items-center cursor-pointer hover:text-indigo-300 transition-colors"
                >
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className="text-[var(--text-strong)] font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes preview */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-3 flex items-center gap-2">
              <FileText size={15} className="text-indigo-400" /> Recent Notes
            </h2>
            {notes.length === 0 ? (
              <p className="text-[var(--text-faint)] text-xs">No notes yet.</p>
            ) : (
              <div className="space-y-1.5">
                {notes.slice(-3).reverse().map(n => (
                  <div key={n.id} className="cursor-pointer" onClick={() => navigate("/notes")}>
                    <p className="text-xs text-[var(--text)] truncate hover:text-indigo-300 transition-colors">{n.title}</p>
                    <p className="text-[10px] text-[var(--text-faint)]">{format(parseISO(n.updatedAt), "MMM d")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Journal */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-strong)]">Daily Journal</h2>
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">Click any day to log what you studied, learned, and how you felt.</p>
          </div>
          <button onClick={() => openJournal(todayKey)} className="btn-secondary text-xs px-3 py-2">
            Open Today
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <JournalHeatmapCell
                  key={day.date}
                  date={day.date}
                  activityCount={day.activityCount}
                  entry={day.entry}
                  onOpen={openJournal}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-faint)]">Journal</span>
            {[1, 2, 3, 4, 5].map((m) => (
              <div
                key={m}
                className={`w-3 h-3 rounded-sm ${moodMeta(m as JournalEntry["mood"]).bg} ring-1 ring-white/10`}
                title={`Mood: ${moodMeta(m as JournalEntry["mood"]).label}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--text-faint)] mr-1">Activity</span>
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} className={`w-3 h-3 rounded-sm ${activityBg(n)} transition-colors`} title={`${n} activities`} />
            ))}
          </div>
        </div>
      </div>

      <DailyJournalModal
        open={journalOpen}
        date={journalDate}
        entry={journal[journalDate]}
        onClose={() => setJournalOpen(false)}
        onSave={(draft) => {
          upsertJournalEntry(journalDate, draft);
          setJournalOpen(false);
        }}
        onDelete={() => {
          deleteJournalEntry(journalDate);
          setJournalOpen(false);
        }}
      />

      {/* Courses quick-view */}
      {courses.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--text-strong)] mb-4">My Courses</h2>
          <div className="grid grid-cols-3 gap-3">
            {courses.map(c => (
              <div
                key={c.id}
                onClick={() => navigate("/courses")}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-indigo-600/30 cursor-pointer transition-colors"
              >
                <div className="w-3 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-strong)] font-medium truncate">{c.code}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{c.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
