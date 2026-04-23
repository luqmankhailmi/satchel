import { useState } from "react";
import { useStore } from "../store/useStore";
import Modal from "../components/Modal";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { TimetableSlot, TimetableDay, SlotType } from "../types";

const DAYS: TimetableDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

const blank = (): Omit<TimetableSlot, "id"> => ({
  day: "Mon", startTime: "08:00", endTime: "09:00",
  courseId: "", room: "", type: "Lecture",
});

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function Timetable() {
  const { timetable, courses, addSlot, updateSlot, deleteSlot } = useStore();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState(blank());

  const openAdd = () => { setEditing(null); setForm(blank()); setModal(true); };
  const openEdit = (s: TimetableSlot) => {
    setEditing(s);
    setForm({ day: s.day, startTime: s.startTime, endTime: s.endTime, courseId: s.courseId, room: s.room ?? "", type: s.type });
    setModal(true);
  };

  const save = () => {
    if (!form.courseId) return;
    if (editing) updateSlot(editing.id, form);
    else addSlot(form);
    setModal(false);
  };

  const getSlotStyle = (slot: TimetableSlot) => {
    const start = timeToMinutes(slot.startTime) - 7 * 60;
    const duration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
    const top = (start / 60) * 64;
    const height = (duration / 60) * 64;
    return { top: `${top}px`, height: `${Math.max(height - 4, 28)}px` };
  };

  const getCourse = (id: string) => courses.find(c => c.id === id);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-strong)]">Timetable</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Your weekly class schedule</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Slot
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-faint)] text-sm">
          Add courses first before building your timetable.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[900px]">
            {/* Time column */}
            <div className="w-16 shrink-0">
              <div className="h-10" />
              {HOURS.map(h => (
                <div key={h} className="h-16 flex items-start pt-1 pr-2">
                  <span className="text-[10px] text-[var(--text-faint)] font-mono">{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map(day => {
              const slots = timetable.filter(s => s.day === day);
              return (
                <div key={day} className="flex-1 min-w-0">
                  {/* Day header */}
                  <div className="h-10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{day}</span>
                  </div>
                  {/* Grid rows */}
                  <div className="relative border-l border-[var(--border-2)]">
                    {HOURS.map(h => (
                      <div key={h} className="h-16 border-b border-[var(--border-2)]" />
                    ))}
                    {/* Slots */}
                    {slots.map(slot => {
                      const course = getCourse(slot.courseId);
                      if (!course) return null;
                      const style = getSlotStyle(slot);
                      return (
                        <div
                          key={slot.id}
                          className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer group overflow-hidden"
                          style={{ ...style, backgroundColor: course.color + "30", borderLeft: `3px solid ${course.color}` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: course.color }}>{course.code}</p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">{slot.type}</p>
                              {slot.room && <p className="text-[10px] text-[var(--text-faint)] truncate">{slot.room}</p>}
                            </div>
                            <div className="hidden group-hover:flex gap-0.5 ml-1">
                              <button onClick={() => openEdit(slot)} className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Edit2 size={10} /></button>
                              <button onClick={() => deleteSlot(slot.id)} className="p-0.5 text-red-500 hover:text-red-300"><Trash2 size={10} /></button>
                            </div>
                          </div>
                          <p className="text-[9px] text-[var(--text-faint)] mt-0.5">{slot.startTime}–{slot.endTime}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Slot" : "Add Timetable Slot"}>
        <div className="space-y-3">
          <div>
            <label className="label">Course *</label>
            <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Day</label>
              <select className="input" value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value as TimetableDay }))}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as SlotType }))}>
                {(["Lecture", "Tutorial", "Lab", "Other"] as SlotType[]).map(t => (
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
            <label className="label">Room / Location</label>
            <input className="input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Block A, Room 201" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing ? "Save" : "Add Slot"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
