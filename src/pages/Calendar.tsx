import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import DailyJournalModal from "../components/DailyJournalModal";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, isToday,
  addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { CalendarEvent, EventType, JournalEntry } from "../types";

const EVENT_COLORS: Record<EventType, string> = {
  event: "bg-indigo-500",
  exam: "bg-red-500",
  assignment: "bg-amber-500",
  reminder: "bg-sky-500",
  holiday: "bg-emerald-500",
};

const EVENT_BADGE: Record<EventType, string> = {
  event: "bg-indigo-900/50 text-indigo-300 border-indigo-700/40",
  exam: "bg-red-900/50 text-red-300 border-red-700/40",
  assignment: "bg-amber-900/50 text-amber-300 border-amber-700/40",
  reminder: "bg-sky-900/50 text-sky-300 border-sky-700/40",
  holiday: "bg-emerald-900/50 text-emerald-300 border-emerald-700/40",
};

const blank = (): Omit<CalendarEvent, "id"> => ({
  title: "", date: format(new Date(), "yyyy-MM-dd"),
  type: "event", description: "", courseId: "", startTime: "", endTime: "",
});

export default function Calendar() {
  const {
    events, courses, tasks,
    addEvent, updateEvent, deleteEvent,
    journal, upsertJournalEntry, deleteJournalEntry,
  } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(blank());
  const [journalOpen, setJournalOpen] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => { (map[e.date] ??= []).push(e); });
    return map;
  }, [events]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.filter(t => t.dueDate && t.status !== "done").forEach(t => {
      (map[t.dueDate!] ??= []).push(t);
    });
    return map;
  }, [tasks]);

  const selectedDateKey = selected ?? format(new Date(), "yyyy-MM-dd");
  const selectedEvents = eventsByDate[selectedDateKey] ?? [];
  const selectedTasks = tasksByDate[selectedDateKey] ?? [];
  const selectedJournal = journal[selectedDateKey];

  const snip = (s?: string, n = 120) => {
    const t = (s ?? "").trim();
    if (!t) return "";
    return t.length > n ? `${t.slice(0, n)}...` : t;
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blank(), date: selectedDateKey });
    setModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditing(e);
    setForm({ title: e.title, date: e.date, type: e.type, description: e.description ?? "", courseId: e.courseId ?? "", startTime: e.startTime ?? "", endTime: e.endTime ?? "" });
    setModal(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editing) updateEvent(editing.id, form);
    else addEvent(form);
    setModal(false);
  };

  return (
    <div className="flex h-full">
      {/* Calendar Grid */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[var(--text-strong)]">{format(current, "MMMM yyyy")}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrent(subMonths(current, 1))} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrent(new Date())} className="btn-secondary text-xs px-3 py-2">Today</button>
            <button onClick={() => setCurrent(addMonths(current, 1))} className="btn-secondary p-2"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
            <div key={d} className="text-center text-xs text-[var(--text-faint)] font-semibold uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px flex-1 bg-[var(--border-2)] rounded-xl overflow-hidden border border-[var(--border-2)]">
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, current);
            const isSelected = key === selectedDateKey;
            const todayDay = isToday(day);
            const dayEvents = eventsByDate[key] ?? [];
            const dayTasks = tasksByDate[key] ?? [];
            const hasJournal = !!journal[key];

            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={`p-2 min-h-[90px] cursor-pointer transition-colors ${isSelected ? "bg-indigo-600/10" : "bg-[var(--surface-4)] hover:bg-[var(--surface-3)]"} ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${todayDay ? "bg-indigo-600 text-white" : "text-[var(--text-muted)]"}`}>
                    {format(day, "d")}
                  </div>
                  {hasJournal && (
                    <div className="w-2 h-2 rounded-sm bg-emerald-400/90 ring-1 ring-white/10" title="Journal entry" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${EVENT_COLORS[e.type]} bg-opacity-20 text-white`}>
                      {e.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, 1).map(t => (
                    <div key={t.id} className="text-[10px] px-1 py-0.5 rounded truncate bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                      {t.title}
                    </div>
                  ))}
                  {(dayEvents.length + dayTasks.length) > 3 && (
                    <div className="text-[9px] text-[var(--text-faint)]">+{dayEvents.length + dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="w-72 border-l border-[var(--border-2)] p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-strong)]">
            {selectedDateKey ? format(parseISO(selectedDateKey), "EEE, MMM d") : "Select a day"}
          </h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1 py-1.5 px-2.5 text-xs">
            <Plus size={12} /> Add
          </button>
        </div>

        {/* Journal */}
        <div className="rounded-lg p-3 border bg-[var(--surface-2)] border-[var(--border)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-strong)]">Daily Journal</p>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setJournalOpen(true)}>
              {selectedJournal ? "Edit" : "Add"}
            </button>
          </div>
          {!selectedJournal ? (
            <p className="text-xs text-[var(--text-faint)] mt-2">No entry yet for this day.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedJournal.mood && (
                <div className="text-[10px] text-[var(--text-muted)]">
                  Mood: <span className="text-[var(--text-strong)] font-medium">{selectedJournal.mood}/5</span>
                </div>
              )}
              {snip(selectedJournal.studied) && (
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] font-semibold uppercase tracking-wide">Studied</p>
                  <p className="text-xs text-[var(--text)] leading-5">{snip(selectedJournal.studied)}</p>
                </div>
              )}
              {snip(selectedJournal.learned) && (
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] font-semibold uppercase tracking-wide">Learned</p>
                  <p className="text-xs text-[var(--text)] leading-5">{snip(selectedJournal.learned)}</p>
                </div>
              )}
              {snip(selectedJournal.felt) && (
                <div>
                  <p className="text-[10px] text-[var(--text-faint)] font-semibold uppercase tracking-wide">Felt</p>
                  <p className="text-xs text-[var(--text)] leading-5">{snip(selectedJournal.felt)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedEvents.length === 0 && selectedTasks.length === 0 && (
          <p className="text-[var(--text-faint)] text-xs text-center py-8">Nothing here. Add an event!</p>
        )}

        {selectedEvents.map(e => (
          <div key={e.id} className={`rounded-lg p-3 border ${EVENT_BADGE[e.type]}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                {e.startTime && <p className="text-xs opacity-70">{e.startTime}{e.endTime && ` – ${e.endTime}`}</p>}
                {e.description && <p className="text-xs opacity-60 mt-1">{e.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(e)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1">✎</button>
                <button onClick={() => deleteEvent(e.id)} className="text-red-600 hover:text-red-400 p-1"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}

        {selectedTasks.map(t => (
          <div key={t.id} className="rounded-lg p-3 border bg-[var(--surface-2)] border-[var(--border)]">
            <p className="text-sm text-[var(--text)] font-medium">{t.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Task due</p>
          </div>
        ))}

        {/* Legend */}
        <div className="mt-auto pt-4 border-t border-[var(--border-2)]">
          <p className="text-xs text-[var(--text-faint)] mb-2 font-semibold">Legend</p>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(EVENT_COLORS) as EventType[]).map(type => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[type]}`} />
                {type}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Event" : "New Event"}>
        <div className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as EventType }))}>
                {(["event", "exam", "assignment", "reminder", "holiday"] as EventType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">None</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add Event"}</button>
          </div>
        </div>
      </Modal>

      <DailyJournalModal
        open={journalOpen}
        date={selectedDateKey}
        entry={selectedJournal as JournalEntry | undefined}
        onClose={() => setJournalOpen(false)}
        onSave={(draft) => {
          upsertJournalEntry(selectedDateKey, draft);
          setJournalOpen(false);
        }}
        onDelete={() => {
          deleteJournalEntry(selectedDateKey);
          setJournalOpen(false);
        }}
      />
    </div>
  );
}
